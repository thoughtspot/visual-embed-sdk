import { ContextType, HostEvent, RuntimeFilterOp } from '../types';
import { MIXPANEL_EVENT, uploadMixpanelEvent } from '../mixpanel-service';
import { logger } from './logger';
import { version as sdkVersion } from './sdk-version';


// we preserver these field's values
const PRESERVED_FIELDS: Array<string> = ['operator', 'oper', 'level'];

export const MAX_ARRAY_TYPES = 10;

export type ParamTypes = string | ParamTypes[] | { [key: string]: ParamTypes };

/*
 * Assumes an already-serialised value, which is what makes the absence of a
 * cycle guard safe: describeParams clones first, and a clone cannot hold a
 * cycle. Do not export this or call it with a raw payload.
 */
const describeValue = (value: unknown): ParamTypes => {
    try {
        if (value === null) {
            return 'null';
        }

        if (Array.isArray(value)) {
            return value.slice(0, MAX_ARRAY_TYPES).map((item) => describeValue(item));
        }

        if (typeof value === 'object') {
            Object.keys(value).forEach(key => {
                if (!PRESERVED_FIELDS.includes(key))
                    (value as any)[key] = describeValue((value as any)[key])
            });
        }

        return typeof value;
    } catch (e) {
        logger.debug('Error parsing type', value);
        return 'ErrorParsing'
    }
};

export const describeParams = (payload: unknown): unknown => {
    let params;
    try {
        /*
         * The round trip drops functions and undefined, and cannot produce a
         * cycle, so the walk below needs no cycle guard. It throws instead on a
         * circular payload, a throwing getter or a BigInt, which is what the
         * catch is for: no parameters are reported, and the reason is logged.
         */
        params = JSON.parse(JSON.stringify(payload));
    } catch (e) {
        logger.debug('Could not describe host event payload', e);
        return {};
    }
    return describeValue(params);
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
