/**
 * Copyright (c) 2026
 *
 * Contracts for the calls a host makes on an App embedded with `DataAppEmbed`,
 * and for the App's events. Same additive-only evolution rules as
 * host-event-contracts.ts.
 * @module contracts
 */

/**
 * Why a call on `DataAppEmbed` was rejected. More codes may be added.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Error Handling
 */
export type DataAppControlErrorCode =
    | 'INVALID_REQUEST'
    | 'LIMIT_EXCEEDED'
    | 'UNSUPPORTED_FIELD'
    | 'APP_MISMATCH'
    | 'CONTROLS_NOT_SUPPORTED'
    | 'NOT_SUPPORTED_IN_DATA_APP'
    | 'APP_NOT_READY'
    | 'NOT_SIGNED_IN'
    | 'VALUE_REFUSED'
    | 'SESSION_LOST'
    | 'TIMEOUT'
    | 'FAILED'
    // Codes of one entry in `results`; VALUE_REFUSED is one too.
    | 'UNKNOWN_CONTROL'
    | 'DUPLICATE_CONTROL'
    | 'INVALID_VALUE'
    | 'CONTROL_NOT_HOST_SETTABLE'
    | (string & {});

/**
 * The outcome of a call for one control.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Error Handling
 */
export interface DataAppControlResult {
    /** The control ID. */
    id: string;
    /** What happened to the value sent for this control. */
    status: 'accepted' | 'rejected' | 'skipped' | (string & {});
    /** Why the value was rejected. */
    code?: DataAppControlErrorCode;
}

/**
 * The rejection of a call on `DataAppEmbed`: an `Error` whose `name` is
 * `'DataAppControlError'`. `message` is the SDK's sentence for `code`.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Error Handling
 * @example
 * ```js
 * dataAppEmbed.trigger(HostEvent.GetFilters).catch((error) => {
 *     if (error.name === 'DataAppControlError') {
 *         console.warn(error.code, error.message);
 *     }
 * });
 * ```
 */
export interface DataAppControlError extends Error {
    /** Why the call was rejected. */
    code: DataAppControlErrorCode;
    /** The SDK's sentence for `code`. */
    message: string;
    /** The outcome for each control the call sent, when known. */
    results?: DataAppControlResult[];
}

/**
 * The value of an App control, or `null` when the control is empty.
 * Setting `null` empties the control, so it filters nothing; it does not bring
 * back the author's default (only `reset: 'defaults'` does). A mandatory
 * control with a default cannot be emptied: set to `null`, it stays at its
 * default.
 *
 * Pass it back as it is, and do not parse it: its fields are not described
 * in this version.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Events
 */
export type DataAppControlValue = Record<string, unknown> | null;

/**
 * One control of an App and its value.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Events
 */
export interface DataAppControl {
    /** The control ID, as the App declares it. */
    id: string;
    /** The control's value. */
    value: DataAppControlValue;
}

/**
 * The controls of an App at one moment. The values come from the App:
 * validate them before you route or render on them.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Events
 */
export interface DataAppControlsState {
    /** The ID of the App. */
    appId: string;
    /** An opaque ID for this opening of the App. Compare it for equality only. */
    session: string;
    /** Counts the changes within one `session`. Compare it only within one `session`. */
    revision: number;
    /** Every control the App declares, with its value. Read them by `id`. */
    controls: DataAppControl[];
}

/**
 * Request payload for {@link HostEvent.GetDataAppControls}.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Events
 */
export interface GetDataAppControlsRequest {
    /** The App the call is meant for. The SDK fills it in when it is left out. */
    appId?: string;
}

/**
 * Response of {@link HostEvent.GetDataAppControls}: the last state the App
 * confirmed.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Events
 */
export type GetDataAppControlsResponse = DataAppControlsState;

/**
 * Payload of {@link EmbedEvent.DataAppReady}.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Events
 */
export type DataAppReadyPayload = DataAppControlsState;

/**
 * Payload of {@link EmbedEvent.DataAppLoad}.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Events
 */
export interface DataAppLoadPayload {
    /** The ID of the App. */
    appId: string;
    /** The opening of the App the load belongs to. */
    session: string;
    /** The revision the tiles loaded for. */
    revision: number;
    /** True for the first `DataAppLoad` after each `DataAppReady`. */
    first: boolean;
}

/**
 * Payload of {@link EmbedEvent.DataAppControlsChanged}. It carries the whole
 * state, so any one event is enough to resync.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Events
 */
export interface DataAppControlsChangedPayload extends DataAppControlsState {
    /**
     * Who made the change. `'host'`: a host call. `'app'`: the viewer or the
     * App's own code. `'system'`: the App adopted values nobody set just now.
     * More values may be added: treat one you do not know as `'app'`.
     */
    source: 'host' | 'app' | 'system' | (string & {});
    /** The controls whose value changed. */
    changed: DataAppControl[];
}

/**
 * Why an App could not be opened: the `reason` of an error with the code
 * `DATA_APP_OPEN_FAILED`. More reasons may be added.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Error Handling
 */
export type DataAppOpenFailedReason =
    | 'CONTROLS_REFUSED'
    | 'CONTROLS_NOT_SUPPORTED'
    | 'NOT_AVAILABLE'
    | 'NOT_SIGNED_IN'
    | 'FAILED'
    | (string & {});
