import { HostEvent } from '../../types';
import { EmbedApiEventResponse } from './contracts';
import { EmbedApiClient } from './embedApiClient';

/**
 * Check if the event is an embed API event.
 * @param messageType
 * @param payload
 * @returns boolean
 */
export function isEmbedApiEvent(messageType: HostEvent, payload: any): boolean {
    if (messageType === HostEvent.Pin && typeof payload === 'object') {
        return true;
    }
    return false;
}

/**
 *
 * @param iFrame
 * @param messageType
 * @param thoughtSpotHost
 * @param data
 * @returns Promise<any>
 */
export async function processEmbedApiEvent<T extends HostEvent>(
    iFrame: HTMLIFrameElement,
    messageType: T,
    thoughtSpotHost: string,
    data: any,
): Promise<{
error?: any;
value?: EmbedApiEventResponse<T>
}> {
    if (messageType === HostEvent.Pin) {
        const embedApiClient = new EmbedApiClient(iFrame, thoughtSpotHost);
        const res = (await embedApiClient.executeEmbedApi('addVizToPinboard', {
            ...data,
        })).filter((r) => r.error || r.value)[0];
        if (res.error) {
            return { error: res?.error?.message };
        }
        if (res.value) {
            return { error: res?.value.errors?.message };
        }

        // could not find a type check to tell ts both are same.
        return { value: res.value } as any;
    }

    return { error: 'Invalid Embed API event' };
}
