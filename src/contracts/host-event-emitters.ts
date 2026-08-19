/**
 * Copyright (c) 2026
 *
 * Type-derived host event emitter helpers.
 *
 * Instead of hand-writing one helper per event (which would drift from the
 * contracts), the emitter surface is DERIVED from the {@link HostEvent} enum
 * and the contract maps at the type level, and implemented generically at
 * runtime. Adding an event to the enum/contracts automatically adds a fully
 * typed emitter — there is no per-event code to keep in sync.
 * @module contracts
 * @example
 * ```js
 * import { createHostEventEmitters } from '@thoughtspot/visual-embed-sdk/contracts';
 *
 * const emit = createHostEventEmitters(liveboardEmbed);
 * await emit.UpdateRuntimeFilters([{ columnName: 'state', operator: 'EQ', values: ['CA'] }]);
 * await emit.Pin({ vizId: '123', newVizName: 'My viz' });
 * ```
 */
import { ContextType, HostEvent } from '../types';
import type { HostEventRequest, HostEventResponse } from './host-event-contracts';

/**
 * Minimal surface of an embed instance needed to emit host events.
 */
export interface HostEventTrigger {
    trigger(
        messageType: HostEvent,
        data?: any,
        context?: ContextType,
    ): Promise<any>;
}

/**
 * One emitter method per {@link HostEvent} member, request/response typed
 * from the event contracts.
 */
export type HostEventEmitters = {
    [MemberK in keyof typeof HostEvent]: (
        data?: HostEventRequest<(typeof HostEvent)[MemberK]>,
        context?: ContextType,
    ) => Promise<HostEventResponse<(typeof HostEvent)[MemberK]>>;
};

/**
 * Creates typed emitter helpers bound to an embed instance.
 * @param embed Any embed instance exposing `trigger()`.
 */
export const createHostEventEmitters = (
    embed: HostEventTrigger,
): HostEventEmitters => {
    const emitters = {} as Record<string, (data?: any, context?: ContextType) => Promise<any>>;
    (Object.keys(HostEvent) as Array<keyof typeof HostEvent>).forEach((memberName) => {
        emitters[memberName] = (data?: any, context?: ContextType) =>
            embed.trigger(HostEvent[memberName], data, context);
    });
    return emitters as HostEventEmitters;
};
