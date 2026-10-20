import { EmbedEvent, MessageCallback, AllEmbedViewConfig } from '../types';
import { EmbedEventPayload } from '../contracts/embed-event-payloads';

interface EmbedViewConfig extends AllEmbedViewConfig, EmbedEventHandlers {}

/**
 * `on{Event}` handler props for the React components. Each handler receives the
 * payload typed for its event (the same {@link EmbedEventPayload} the imperative
 * `embed.on()` delivers), so `onData`, `onVizPointClick`, etc. are per-event
 * typed rather than the loose {@link MessageCallback}.
 */
export type EmbedEventHandlers = {
    [K in keyof typeof EmbedEvent as `on${Capitalize<K>}`]?: (
        payload: EmbedEventPayload<(typeof EmbedEvent)[K]>,
        responder?: (data: any) => void,
    ) => void;
};

export interface EmbedProps extends EmbedViewConfig {
    className?: string;
    style?: React.CSSProperties;
}

export interface ViewConfigAndListeners<T extends EmbedViewConfig> {
    viewConfig: T;
    listeners: { [key in EmbedEvent]?: MessageCallback };
}

/**
 *
 * @param props
 */
export function getViewPropsAndListeners<
    T extends EmbedProps,
    U extends EmbedViewConfig>(props: T): ViewConfigAndListeners<U> {
    return Object.keys(props).reduce(
        (accu, key) => {
            if (key.startsWith('on')) {
                const eventName = key.substr(2) as any;
                (accu.listeners as any)[EmbedEvent[eventName as keyof typeof EmbedEvent] as any] = props[key as keyof T];
            } else {
                (accu.viewConfig as any)[key] = props[key as keyof T];
            }
            return accu;
        },
        {
            viewConfig: {} as U,
            listeners: {},
        },
    );
}
