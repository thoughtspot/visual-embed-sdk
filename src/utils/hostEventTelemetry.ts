import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';
import { ContextType, HostEvent, RuntimeFilterOp } from '../types';
import { ApplicabilityLevel } from '../embed/hostEventClient/contracts';
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
    level: Object.values(ApplicabilityLevel),
};

export const MAX_ARRAY_TYPES = 10;

export type ParamTypes = string | ParamTypes[] | { [key: string]: ParamTypes };

const describeValue = (value: unknown, key: string): ParamTypes => {
    if (value === null) {
        return 'null';
    }
    if (typeof value === 'string' && ENUM_PARAMS[key]?.includes(value)) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.slice(0, MAX_ARRAY_TYPES).map((item) => describeValue(item, key));
    }
    if (isPlainObject(value)) {
        return mapValues(value as Record<string, unknown>, describeValue);
    }
    return typeof value;
};

export const describeParams = (payload: unknown): Record<string, ParamTypes> => {
    let params;
    try {
        /*
         * The round trip drops functions and undefined, and cannot produce a
         * cycle, so the walk below needs no cycle guard. It throws instead on a
         * circular payload, a throwing getter or a BigInt, which is what the
         * catch is for: no parameters are reported, and the reason is logged.
         */
        params = JSON.parse(JSON.stringify(Array.isArray(payload) ? payload[0] : payload));
    } catch (e) {
        logger.debug('Could not describe host event payload', e);
        return {};
    }
    if (!isPlainObject(params)) {
        return {};
    }
    return mapValues(params as Record<string, unknown>, describeValue);
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
