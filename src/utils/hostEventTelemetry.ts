/*
 * Telemetry helpers for host events. These build the property bag uploaded
 * with the host event Mixpanel events, so we can answer which host events are
 * triggered, which parameters of those events are actually used, and how those
 * triggers resolve.
 *
 * Host event payloads carry customer data — GUIDs, filter values, search
 * strings and column names. So a value is reported as its `typeof`, not as
 * itself: `name:string`, never `name:"Quarterly revenue"`.
 *
 * The one exception is an SDK enum. `operator:EQ` is a fixed, low-cardinality
 * token from our own contract, and knowing *which* operator customers pass is
 * the point of the exercise, so enum members are reported by value. A value is
 * treated as an enum member only when its key is a known enum-valued parameter
 * *and* the value matches one of that enum's members exactly — anything else
 * falls back to its type.
 *
 * Key names are reported too, but only when they read as SDK contract
 * identifiers; a payload can be keyed by a customer column name, so anything
 * else becomes REDACTED_KEY.
 */

import { ContextType, HostEvent, RuntimeFilterOp } from '../types';
import { ApplicabilityLevel } from '../embed/hostEventClient/contracts';
import { version as sdkVersion } from './sdk-version';

/** How deep into a payload the shape walk goes before it summarizes. */
export const MAX_SHAPE_DEPTH = 3;

/** Upper bound on the number of key paths reported for one payload. */
export const MAX_SHAPE_PATHS = 40;

/** Key names longer than this are reported as {@link REDACTED_KEY}. */
export const MAX_KEY_LENGTH = 40;

/** Stands in for a key name that could carry customer data. */
export const REDACTED_KEY = 'redactedKey';

/**
 * Path label for a payload that is not a key-value record, so that an array
 * payload reads as `payload[].columnName` rather than starting with a colon.
 */
const ROOT_PATH = 'payload';

/**
 * A key is reported verbatim only when it reads as a plain code identifier,
 * the way every key in the host event contracts does. A customer column name
 * used as a key ("Total Sales", "région") fails this and gets redacted.
 */
const SAFE_KEY_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Host event parameters that are typed as an SDK enum, and the members that
 * enum allows. A value under one of these keys is reported as-is when it is
 * one of the listed members — it is a token from our own contract, not
 * customer data. Add a key here when a host event gains an enum parameter.
 */
const ENUM_VALUED_PARAMS: Record<string, readonly string[]> = {
    // `RuntimeFilter.operator`, and the `oper` spelling that
    // `HostEvent.UpdateFilters` also accepts.
    operator: Object.values(RuntimeFilterOp),
    oper: Object.values(RuntimeFilterOp),
    // `Applicability.level` on a filter or parameter update.
    level: Object.values(ApplicabilityLevel),
};

/**
 * Whether a value is a member of the enum its key is typed as.
 * @param key The key the value sits under
 * @param value The string value at that key
 */
function isEnumMember(key: string, value: string): boolean {
    return ENUM_VALUED_PARAMS[key]?.includes(value) ?? false;
}

/**
 * Which dispatch branch inside `HostEventClient.triggerHostEvent` served the
 * host event. This is the branch that ran, not the channel that ultimately
 * carried the message: `custom-handler` means "a setter with custom logic ran",
 * and both it and `ui-passthrough` can fall back to the legacy channel
 * internally — a custom handler when the payload lacks the fields it needs, and
 * a passthrough getter when the app returns no usable response.
 */
export type HostEventRoute = 'custom-handler' | 'ui-passthrough' | 'legacy';

/**
 * How a host event trigger ended. Everything other than `success` is a case
 * the host application cannot currently see in aggregate.
 */
export type HostEventStatus =
    | 'success'
    | 'error'
    | 'timed-out'
    | 'render-not-called'
    | 'host-event-undefined'
    | 'no-iframe';

/**
 * The shape of a host event payload, with no values in it.
 */
export interface HostEventPayloadShape {
    /** Whether the caller passed a payload with anything in it. */
    hasPayload: boolean;
    /** Top-level container kind of the payload. */
    payloadType: 'none' | 'object' | 'array' | 'primitive' | 'unknown';
    /** Top-level key count for an object payload, or length for an array. */
    paramCount: number;
    /**
     * Sorted top-level parameter names. For an array payload these are the
     * keys of the first element, which is what identifies, say, which filter
     * fields a customer sets on `HostEvent.UpdateFilters`.
     */
    paramKeys: string[];
    /**
     * Key paths annotated with value type — `runtimeFilters:array(3)`,
     * `runtimeFilters[].columnName:string`, `start:true`. Boolean values are
     * reported as-is because the value is the usage signal and carries no
     * customer data; every other value is reduced to its type.
     */
    paramShape: string[];
    /** Whether the walk hit {@link MAX_SHAPE_PATHS} or {@link MAX_SHAPE_DEPTH}. */
    shapeTruncated: boolean;
}

const EMPTY_SHAPE: HostEventPayloadShape = {
    hasPayload: false,
    payloadType: 'none',
    paramCount: 0,
    paramKeys: [],
    paramShape: [],
    shapeTruncated: false,
};

/**
 * Returns the key if it reads as a code identifier, and a placeholder if it
 * could be customer data.
 * @param key A key from a host event payload
 */
function sanitizeKey(key: string): string {
    return key.length <= MAX_KEY_LENGTH && SAFE_KEY_PATTERN.test(key) ? key : REDACTED_KEY;
}

/**
 * Describes a leaf value by its type, so the value itself never leaves the
 * browser. An SDK enum member is the one exception — see the module comment.
 * @param value A leaf value from a host event payload
 * @param key The key the value sits under, used to spot enum parameters
 */
function describeLeaf(value: unknown, key?: string): string {
    if (value === null) {
        return 'null';
    }
    if (typeof value === 'string' && key && isEnumMember(key, value)) {
        return value;
    }
    return typeof value;
}

/**
 * Whether a value should be walked into as a key-value record.
 * @param value A value from a host event payload
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface ShapeAccumulator {
    paths: string[];
    truncated: boolean;
}

/**
 * Walks a payload branch, appending `path:type` entries to the accumulator.
 * The depth and path caps also bound cyclic payloads.
 * @param value The value at this path
 * @param path The dotted path to this value
 * @param acc Collected paths and the truncation flag
 * @param depth Current walk depth
 * @param key The raw key this value sits under, if it has one
 */
function walkShape(
    value: unknown,
    path: string,
    acc: ShapeAccumulator,
    depth: number,
    key?: string,
): void {
    if (acc.paths.length >= MAX_SHAPE_PATHS) {
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
}

/**
 * Summarizes a host event payload as shape only, never values.
 * @param payload The payload passed to `trigger`
 * @example
 * ```js
 * describeHostEventPayload({ runtimeFilters: [{ columnName: 'Region' }] });
 * // paramKeys: ['runtimeFilters']
 * // paramShape: ['runtimeFilters:array(1)', 'runtimeFilters[]:object(1)',
 * //              'runtimeFilters[].columnName:string']
 * ```
 */
export function describeHostEventPayload(payload: unknown): HostEventPayloadShape {
    if (payload === undefined || payload === null) {
        return { ...EMPTY_SHAPE };
    }

    try {
        const acc: ShapeAccumulator = { paths: [], truncated: false };

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
        // A payload with a throwing getter must never break the trigger it is
        // describing.
        return { ...EMPTY_SHAPE, payloadType: 'unknown' };
    }
}

/**
 * The properties uploaded with a host event Mixpanel event.
 */
export interface HostEventTelemetryProps extends HostEventPayloadShape {
    /** The host event that was triggered. */
    hostEvent: string;
    /** The context the trigger was scoped to, or `none`. */
    contextType: string;
    /** Which embed component triggered it, or `unknown`. */
    embedComponentType: string;
    /** Version of the SDK the host application is on. */
    sdkVersion: string;
}

/**
 * Builds the property bag for a host event trigger.
 *
 * The name of the host event is a *property* here, not only a suffix on the
 * Mixpanel event name, so that a single report can rank host events by usage
 * instead of one report per event name.
 * @param params Trigger details
 * @param params.hostEvent The host event being triggered
 * @param params.payload The payload passed to `trigger`
 * @param params.context The context the trigger is scoped to
 * @param params.embedComponentType The embed component that is triggering
 */
export function getHostEventTelemetryProps({
    hostEvent,
    payload,
    context,
    embedComponentType,
}: {
    hostEvent: HostEvent;
    payload?: unknown;
    context?: ContextType;
    embedComponentType?: string;
}): HostEventTelemetryProps {
    return {
        hostEvent: String(hostEvent),
        contextType: context ? String(context) : 'none',
        embedComponentType: embedComponentType || 'unknown',
        sdkVersion,
        ...describeHostEventPayload(payload),
    };
}
