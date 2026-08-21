import { ContextType, EmbedEvent, HostEvent, RuntimeFilterOp } from '../types';
import { ApplicabilityLevel } from '../embed/hostEventClient/contracts';
import { getEmbedConfig } from '../embed/embedConfig';
import { uploadMixpanelEvent } from '../mixpanel-service';
import { logger } from './logger';
import { version as sdkVersion } from './sdk-version';

export const MAX_SHAPE_DEPTH = 3;
export const MAX_SHAPE_PATHS = 40;
export const MAX_EMBED_SHAPE_PATHS = 20;
export const MAX_KEY_LENGTH = 40;
export const REDACTED_KEY = 'redactedKey';
export const IDLE_TIMEOUT = 2000;
export const RESPONSE_WAIT_MS = 5000;

const ROOT_PATH = 'payload';
const SAFE_KEY_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/*
 * TODO: this hand-maintained map does not scale. Every host event that gains an
 * enum parameter has to be added by hand and nothing fails if it is forgotten,
 * so an unlisted enum silently degrades to `string`. A generated map, or a
 * marker on the contract types that the members can be read back from, would
 * keep it honest. Worth finding a better way.
 */
const ENUM_VALUED_PARAMS: Record<string, readonly string[]> = {
    operator: Object.values(RuntimeFilterOp),
    oper: Object.values(RuntimeFilterOp),
    level: Object.values(ApplicabilityLevel),
};

export type HostEventRoute = 'custom-handler' | 'ui-passthrough' | 'legacy';

export type HostEventStatus =
    | 'success'
    | 'error'
    | 'timed-out'
    | 'render-not-called'
    | 'host-event-undefined'
    | 'no-iframe';

export interface PayloadShape {
    hasPayload: boolean;
    payloadType: 'none' | 'object' | 'array' | 'primitive' | 'unknown';
    paramCount: number;
    paramKeys: string[];
    paramShape: string[];
    shapeTruncated: boolean;
}

export interface HostEventTelemetryProps extends PayloadShape {
    hostEvent: string;
    contextType: string;
    embedComponentType: string;
    sdkVersion: string;
    status: HostEventStatus;
    durationMs: number;
    route?: HostEventRoute;
    errorCode?: string;
}

export interface EmbedEventTelemetryProps extends PayloadShape {
    embedEvent: string;
    embedComponentType: string;
    sdkVersion: string;
    eventStatus: string;
    handlerCount: number;
    canRespond: boolean;
    responded: boolean;
}

export interface ResponseShape {
    responseType: PayloadShape['payloadType'];
    responseKeys: string[];
    responseShape: string[];
}

interface ShapeAccumulator {
    paths: string[];
    truncated: boolean;
    maxPaths: number;
}

const EMPTY_SHAPE: PayloadShape = {
    hasPayload: false,
    payloadType: 'none',
    paramCount: 0,
    paramKeys: [],
    paramShape: [],
    shapeTruncated: false,
};

const sanitizeKey = (key: string): string => (
    key.length <= MAX_KEY_LENGTH && SAFE_KEY_PATTERN.test(key) ? key : REDACTED_KEY
);

const isEnumMember = (key: string, value: string): boolean => (
    ENUM_VALUED_PARAMS[key]?.includes(value) ?? false
);

const describeLeaf = (value: unknown, key?: string): string => {
    if (value === null) {
        return 'null';
    }
    if (typeof value === 'string' && key && isEnumMember(key, value)) {
        return value;
    }
    return typeof value;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const walkShape = (
    value: unknown,
    path: string,
    acc: ShapeAccumulator,
    depth: number,
    key?: string,
): void => {
    if (acc.paths.length >= acc.maxPaths) {
        acc.truncated = true;
        return;
    }

    if (Array.isArray(value)) {
        acc.paths.push(`${path}:array(${value.length})`);
        if (value.length === 0) {
            return;
        }
        if (depth >= MAX_SHAPE_DEPTH) {
            acc.truncated = true;
            return;
        }
        walkShape(value[0], `${path}[]`, acc, depth + 1, key);
        return;
    }

    if (isRecord(value)) {
        const keys = Object.keys(value);
        acc.paths.push(`${path}:object(${keys.length})`);
        if (keys.length === 0) {
            return;
        }
        if (depth >= MAX_SHAPE_DEPTH) {
            acc.truncated = true;
            return;
        }
        keys.sort().forEach((childKey) => {
            walkShape(
                value[childKey], `${path}.${sanitizeKey(childKey)}`, acc, depth + 1, childKey,
            );
        });
        return;
    }

    acc.paths.push(`${path}:${describeLeaf(value, key)}`);
};

export const describePayload = (
    payload: unknown,
    maxPaths = MAX_SHAPE_PATHS,
): PayloadShape => {
    if (payload === undefined || payload === null) {
        return { ...EMPTY_SHAPE };
    }

    try {
        const acc: ShapeAccumulator = { paths: [], truncated: false, maxPaths };

        if (Array.isArray(payload)) {
            const firstElement = payload[0];
            walkShape(payload, ROOT_PATH, acc, 0);
            return {
                hasPayload: payload.length > 0,
                payloadType: 'array',
                paramCount: payload.length,
                paramKeys: isRecord(firstElement)
                    ? Object.keys(firstElement).map(sanitizeKey).sort()
                    : [],
                paramShape: acc.paths,
                shapeTruncated: acc.truncated,
            };
        }

        if (isRecord(payload)) {
            const keys = Object.keys(payload);
            keys.sort().forEach((key) => {
                walkShape(payload[key], sanitizeKey(key), acc, 1, key);
            });
            return {
                hasPayload: keys.length > 0,
                payloadType: 'object',
                paramCount: keys.length,
                paramKeys: keys.map(sanitizeKey),
                paramShape: acc.paths,
                shapeTruncated: acc.truncated,
            };
        }

        return {
            ...EMPTY_SHAPE,
            hasPayload: true,
            payloadType: 'primitive',
            paramShape: [`${ROOT_PATH}:${describeLeaf(payload)}`],
        };
    } catch (e) {
        return { ...EMPTY_SHAPE, payloadType: 'unknown' };
    }
};

export const describeResponse = (
    payload: unknown,
    maxPaths = MAX_SHAPE_PATHS,
): ResponseShape => {
    const shape = describePayload(payload, maxPaths);
    return {
        responseType: shape.payloadType,
        responseKeys: shape.paramKeys,
        responseShape: shape.paramShape,
    };
};

export const isTelemetryEnabled = (): boolean => !getEmbedConfig()?.disableSDKTracking;

const runWhenIdle = (work: () => void): void => {
    const idle = (globalThis as any)?.requestIdleCallback;
    if (typeof idle === 'function') {
        idle(work, { timeout: IDLE_TIMEOUT });
        return;
    }
    setTimeout(work, 0);
};

export const reportEvent = (eventId: string, props: Record<string, any>): void => {
    if (!isTelemetryEnabled()) {
        return;
    }
    runWhenIdle(() => {
        try {
            uploadMixpanelEvent(eventId, props);
        } catch (e) {
            logger.debug('Could not report telemetry for', eventId, e);
        }
    });
};

export const getHostEventTelemetryProps = ({
    hostEvent,
    payload,
    context,
    embedComponentType,
    status,
    durationMs,
    route,
    errorCode,
}: {
    hostEvent: HostEvent;
    payload?: unknown;
    context?: ContextType;
    embedComponentType?: string;
    status: HostEventStatus;
    durationMs: number;
    route?: HostEventRoute;
    errorCode?: string;
}): HostEventTelemetryProps => ({
    hostEvent: String(hostEvent),
    contextType: context ? String(context) : 'none',
    embedComponentType: embedComponentType || 'unknown',
    sdkVersion,
    status,
    durationMs,
    ...(route ? { route } : {}),
    ...(errorCode ? { errorCode } : {}),
    ...describePayload(payload),
});

export const getEmbedEventTelemetryProps = ({
    embedEvent,
    payload,
    embedComponentType,
}: {
    embedEvent: EmbedEvent;
    payload?: any;
    embedComponentType?: string;
}): Omit<EmbedEventTelemetryProps, 'handlerCount' | 'canRespond' | 'responded'> => ({
    embedEvent: String(embedEvent),
    embedComponentType: embedComponentType || 'unknown',
    sdkVersion,
    eventStatus: payload?.status ? String(payload.status) : 'none',
    ...describePayload(payload, MAX_EMBED_SHAPE_PATHS),
});
