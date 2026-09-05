/**
 * Copyright (c) 2026
 *
 * `@thoughtspot/visual-embed-sdk/contracts`
 *
 * Single source of truth for the Visual Embed SDK <-> ThoughtSpot app event
 * contracts. Consumed by:
 * - the SDK itself (compile-time types for `trigger()` / `on()`),
 * - the ThoughtSpot app (host-side handler typing + runtime validation),
 * - documentation generation.
 *
 * Evolution policy: ADDITIVE ONLY. See host-event-contracts.ts header.
 * @module contracts
 */
export {
    HostEvent,
    EmbedEvent,
    ContextType,
} from '../types';
export type {
    RuntimeFilter,
    RuntimeParameter,
    MessagePayload,
    // Code-based custom action config (sent to the host at init as
    // DefaultAppInitData.customActions) + the click event payload.
    CustomAction,
    CustomActionPayload,
} from '../types';
export {
    CustomActionsPosition,
    CustomActionTarget,
} from '../types';

export * from './host-event-contracts';
export * from './embed-event-payloads';

// UI passthrough contracts remain in their historical home; re-exported so
// the contracts subpath is self-sufficient for host-side consumers.
export {
    UIPassthroughEvent,
    ApplicabilityLevel,
} from './ui-passthrough-contracts';
export type {
    Applicability,
    FilterUpdate,
    LiveboardFilter,
    LiveboardParameter,
    LiveboardTab,
    LiveboardGroup,
    UIPassthroughRequest,
    UIPassthroughResponse,
    UIPassthroughArrayResponse,
} from './ui-passthrough-contracts';
