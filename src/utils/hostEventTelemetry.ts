import isPlainObject from 'lodash/isPlainObject';
import mapKeys from 'lodash/mapKeys';
import mapValues from 'lodash/mapValues';
import { ContextType, HostEvent, RuntimeFilterOp } from '../types';
import { version as sdkVersion } from './sdk-version';

export const REDACTED_KEY = 'redactedKey';

/*
 * TODO: hand-maintained, so an enum parameter nobody adds here silently
 * reports `string`. Generating it, or reading members off the contract
 * types, would be better.
 */
const ENUM_PARAMS: Record<string, readonly string[]> = {
    operator: Object.values(RuntimeFilterOp),
    oper: Object.values(RuntimeFilterOp),
};

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]{0,39}$/;

const paramName = (key: string) => (IDENTIFIER.test(key) ? key : REDACTED_KEY);

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
    return mapKeys(mapValues(params as object, paramType), (_type, key) => paramName(key));
};

export const getHostEventTelemetryProps = ({
    hostEvent,
    payload,
    context,
    embedComponentType,
}: {
    hostEvent: HostEvent;
    payload?: unknown;
    context?: ContextType;
    embedComponentType?: string;
}) => {
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
