/**
 * Copyright (c) 2026
 *
 * Typed payload contracts for {@link EmbedEvent}s (ThoughtSpot app -> SDK).
 *
 * The SDK delivers embed events to `embed.on()` callbacks wrapped in the
 * {@link MessagePayload} envelope `{ type, data, status? }`. The map below
 * types the `data` field per event. Events absent from the map resolve to
 * `any` until their payload is audited against what the host actually sends
 * (codify observed behavior, not documented behavior).
 *
 * Same additive-only evolution rules as host-event-contracts.ts.
 * @module contracts
 */
import type { CustomActionPayload, EmbedEvent, MessagePayload } from '../types';
// Type-only: AnswerService is an SDK-side enrichment (see
// EmbedEventEnvelopeExtension). Type-only import keeps the contracts subpath
// free of any runtime dependency on the answer-service implementation.
import type { AnswerService } from '../utils/graphql/answerService/answerService';

/**
 * Typed `data` field per embed event. Seed with audited events only.
 */
export interface EmbedEventDataExtension {
    [EmbedEvent.AuthInit]: {
        /**
         * Whether authentication was successful.
         */
        isLoggedIn?: boolean;
        [key: string]: any;
    };
    [EmbedEvent.EmbedListenerReady]: Record<string, any>;
    /**
     * Fired when a callback-type custom action is triggered. Use
     * `payload.data.id` to identify which action fired.
     */
    [EmbedEvent.CustomAction]: CustomActionPayload;
}

/**
 * Resolves the typed `data` payload for an embed event; `any` when the
 * event has not been audited/typed yet.
 */
export type EmbedEventData<EmbedEventT extends EmbedEvent> =
    EmbedEventT extends keyof EmbedEventDataExtension
        ? EmbedEventDataExtension[EmbedEventT]
        : any;

/**
 * Full envelope delivered to `embed.on()` callbacks for a given event:
 * the wire fields (`type`, `status`) plus the typed `data`.
 */
export type EmbedEventPayload<EmbedEventT extends EmbedEvent> =
    Omit<MessagePayload, 'data'> & {
        data: EmbedEventData<EmbedEventT>;
    };

/**
 * Payload delivered to `on(EmbedEvent.CustomAction)`. Beyond the wire fields,
 * the SDK attaches an {@link AnswerService} built from the event's session and
 * answer data (see utils/processData.ts `processCustomAction`) — annotate your
 * callback with this type to access it:
 *
 * ```ts
 * embed.on(EmbedEvent.CustomAction, (payload: CustomActionEventPayload) => {
 *   if (payload.data.id === 'my-action') {
 *     payload.answerService?.getUnderlyingDataForPoint([]);
 *   }
 * });
 * ```
 *
 * It is a dedicated type rather than folded into `on()`'s generic callback
 * because the SDK's event registry types callbacks as the plain
 * {@link MessagePayload}, which the enrichment cannot be intersected into
 * without restructuring that registry.
 */
export type CustomActionEventPayload =
    EmbedEventPayload<EmbedEvent.CustomAction> & { answerService?: AnswerService };

/**
 * String-name keyed view for the host side (addresses events by wire value).
 */
export type EmbedEventName = `${EmbedEvent}`;
