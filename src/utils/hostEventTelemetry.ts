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

const paramType = (value: unknown, key: string) => {
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return `array(${value.length})`;
    }
    if (typeof value === 'string' && ENUM_PARAMS[key]?.includes(value)) {
        return value;
    }
    return typeof value;
};

export const describeParams = (payload: unknown): Record<string, string> => {
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

export const reportHostEvent = (params: HostEventTelemetryParams): void => {
    try {
        uploadMixpanelEvent(
            `${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${params.hostEvent}`,
            getHostEventTelemetryProps(params),
        );
    } catch (e) {
        logger.debug('Could not report host event telemetry', e);
    }
};
