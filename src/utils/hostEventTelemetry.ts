import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';
import { ContextType, HostEvent, RuntimeFilterOp } from '../types';
import { MIXPANEL_EVENT, uploadMixpanelEvent } from '../mixpanel-service';
import { logger } from './logger';
import { version as sdkVersion } from './sdk-version';

/*
 * TODO: hand-maintained, so an enum parameter nobody adds here silently
 * reports `string`. Generating it, or reading members off the contract
 * types, would be better.
 */
const ENUM_PARAMS: Record<string, readonly string[]> = {
    operator: Object.values(RuntimeFilterOp),
    oper: Object.values(RuntimeFilterOp),
};

export const MAX_ARRAY_TYPES = 10;

const valueType = (value: unknown, key: string): string => {
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    if (typeof value === 'string' && ENUM_PARAMS[key]?.includes(value)) {
        return value;
    }
    return typeof value;
};

const paramType = (value: unknown, key: string): string | string[] => (
    Array.isArray(value)
        ? value.slice(0, MAX_ARRAY_TYPES).map((item) => valueType(item, key))
        : valueType(value, key)
);

export const describeParams = (payload: unknown): Record<string, string | string[]> => {
    const params = Array.isArray(payload) ? payload[0] : payload;
    if (!isPlainObject(params)) {
        return {};
    }
    return mapValues(params as Record<string, unknown>, paramType);
};

export interface HostEventTelemetryParams {
    hostEvent: HostEvent;
    payload?: unknown;
    context?: ContextType;
    embedComponentType?: string;
}

export const getHostEventTelemetryProps = ({
    hostEvent,
    payload,
    context,
    embedComponentType,
}: HostEventTelemetryParams) => {
    const params = describeParams(payload);
    return {
        hostEvent: String(hostEvent),
        contextType: context ? String(context) : 'none',
        embedComponentType: embedComponentType || 'unknown',
        sdkVersion,
        params,
        paramKeys: Object.keys(params),
    };
};

export type HostEventStatus =
    | 'success'
    | 'error'
    | 'timed-out'
    | 'render-not-called'
    | 'host-event-undefined'
    | 'no-iframe'
    | 'no-outcome';

export interface HostEventOutcome {
    status: HostEventStatus;
    durationMs: number;
}

interface PendingHostEvent {
    id: string;
    props: Record<string, unknown>;
    startedAt: number;
    flushTimer: ReturnType<typeof setTimeout>;
}

export const PENDING_FLUSH_MS = 35000;

const pending = new Map<string, PendingHostEvent>();
let hostEventCounter = 0;

const upload = (props: Record<string, unknown>) => {
    Promise.resolve().then(() => {
        uploadMixpanelEvent(`${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${props.hostEvent}`, props);
    }).catch((e) => logger.debug('Could not report host event telemetry', e));
};

const flush = (id: string, outcome: HostEventOutcome) => {
    const entry = pending.get(id);
    if (!entry) {
        return;
    }
    pending.delete(id);
    clearTimeout(entry.flushTimer);
    upload({ ...entry.props, ...outcome });
};

export const reportHostEvent = (params: HostEventTelemetryParams): string => {
    hostEventCounter += 1;
    const id = `he-${hostEventCounter}`;
    try {
        const startedAt = Date.now();
        pending.set(id, {
            id,
            props: { ...getHostEventTelemetryProps(params), hostEventId: id },
            startedAt,
            flushTimer: setTimeout(
                () => flush(id, { status: 'no-outcome', durationMs: Date.now() - startedAt }),
                PENDING_FLUSH_MS,
            ),
        });
    } catch (e) {
        logger.debug('Could not start host event telemetry', e);
    }
    return id;
};

export const reportHostEventOutcome = (id: string, status: HostEventStatus): void => {
    try {
        const entry = pending.get(id);
        if (entry) {
            flush(id, { status, durationMs: Date.now() - entry.startedAt });
        }
    } catch (e) {
        logger.debug('Could not report host event telemetry', e);
    }
};

export const testResetHostEventTelemetry = (): void => {
    pending.forEach((entry) => clearTimeout(entry.flushTimer));
    pending.clear();
    hostEventCounter = 0;
};
