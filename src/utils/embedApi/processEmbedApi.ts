import { EmbedEvent, HostEvent } from '../../types';
import {
    EmbedApiEvent, EmbedApiResponse, FlattenType, HostEventRequest, HostEventResponse,
} from './contracts';
import { HostEventClient } from './embedApiClient';

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
