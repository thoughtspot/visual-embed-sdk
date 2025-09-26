import { EmbedEvent, MessageCallback, AllEmbedViewConfig } from '../types';

interface EmbedViewConfig extends AllEmbedViewConfig, EmbedEventHandlers {}

export type EmbedEventHandlers = { [key in keyof typeof EmbedEvent as `on${Capitalize<key>}`]?: MessageCallback };

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
