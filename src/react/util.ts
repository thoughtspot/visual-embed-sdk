import { EmbedEvent, MessageCallback, ViewConfig } from '../types';

export type EmbedEventHandlers = { [key in keyof typeof EmbedEvent as `on${Capitalize<key>}`]?: MessageCallback };

export interface EmbedProps extends ViewConfig, EmbedEventHandlers {
    className?: string;
}

export interface ViewConfigAndListeners<T extends ViewConfig> {
    viewConfig: T;
    listeners: { [key in EmbedEvent]?: MessageCallback };
}

/**
 *
 * @param props
 */
export function getViewPropsAndListeners<
    T extends EmbedProps,
    U extends ViewConfig>(props: T): ViewConfigAndListeners<U> {
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
