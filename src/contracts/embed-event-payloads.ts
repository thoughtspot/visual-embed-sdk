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
import type { EmbedEvent, MessagePayload } from '../types';

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
 * Full envelope delivered to `embed.on()` callbacks for a given event.
 */
export type EmbedEventPayload<EmbedEventT extends EmbedEvent> =
    Omit<MessagePayload, 'data'> & {
        data: EmbedEventData<EmbedEventT>;
    };

/**
 * String-name keyed view for the host side (addresses events by wire value).
 */
export type EmbedEventName = `${EmbedEvent}`;
