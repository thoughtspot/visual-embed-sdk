/// <reference types="react" />
import { EmbedEvent, MessageCallback, AllEmbedViewConfig } from '../types';
interface EmbedViewConfig extends AllEmbedViewConfig, EmbedEventHandlers {
}
export type EmbedEventHandlers = {
    [key in keyof typeof EmbedEvent as `on${Capitalize<key>}`]?: MessageCallback;
};
export interface EmbedProps extends EmbedViewConfig {
    className?: string;
    style?: React.CSSProperties;
}
export interface ViewConfigAndListeners<T extends EmbedViewConfig> {
    viewConfig: T;
    listeners: {
        [key in EmbedEvent]?: MessageCallback;
    };
}
/**
 *
 * @param props
 */
export declare function getViewPropsAndListeners<T extends EmbedProps, U extends EmbedViewConfig>(props: T): ViewConfigAndListeners<U>;
export {};
//# sourceMappingURL=util.d.ts.map