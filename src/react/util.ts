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
                const eventName = key.substr(2);
                accu.listeners[EmbedEvent[eventName]] = props[key];
            } else {
                accu.viewConfig[key] = props[key];
            }
            return accu;
        },
        {
            viewConfig: {} as U,
            listeners: {},
        },
    );
}
