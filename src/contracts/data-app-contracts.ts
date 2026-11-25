/**
 * Copyright (c) 2026
 *
 * Contracts for the calls a host makes on an App embedded with `DataAppEmbed`.
 * Same additive-only evolution rules as host-event-contracts.ts.
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
    | 'SUPERSEDED'
    | 'RATE_LIMITED'
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
