import React from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { SearchEmbed as _SearchEmbed, SearchViewConfig } from '../embed/search';
import { AppEmbed as _AppEmbed, AppViewConfig } from '../embed/app';
import {
    LiveboardEmbed as _LiveboardEmbed,
    LiveboardViewConfig,
} from '../embed/liveboard';
import { TsEmbed, ViewConfig } from '../embed/ts-embed';

import { EmbedEvent } from '../types';
import { EmbedProps, getViewPropsAndListeners } from './util';

const componentFactory = <
    T extends typeof TsEmbed,
    U extends EmbedProps,
    V extends ViewConfig
>(
    EmbedConstructor: T,
) =>
    React.forwardRef<TsEmbed, U>(
        (props: U, forwardedRef: React.MutableRefObject<TsEmbed>) => {
            const ref = React.useRef<HTMLDivElement>(null);
            const { className, ...embedProps } = props;
            const { viewConfig, listeners } = getViewPropsAndListeners<
                Omit<U, 'className'>,
                V
            >(embedProps);
            useDeepCompareEffect(() => {
                const tsEmbed = new EmbedConstructor(ref!.current, {
                    ...viewConfig,
                });
                Object.keys(listeners).forEach((eventName) => {
                    tsEmbed.on(
                        eventName as EmbedEvent,
                        listeners[eventName as EmbedEvent],
                    );
                });
                tsEmbed.render();
                if (forwardedRef) {
                    // eslint-disable-next-line no-param-reassign
                    forwardedRef.current = tsEmbed;
                }
            }, [viewConfig, listeners]);

            return (
                <div
                    data-testid="tsEmbed"
                    ref={ref}
                    className={className}
                ></div>
            );
        },
    );

interface SearchProps extends EmbedProps, SearchViewConfig {}

export const SearchEmbed = componentFactory<
    typeof _SearchEmbed,
    SearchProps,
    SearchViewConfig
>(_SearchEmbed);

interface AppProps extends EmbedProps, AppViewConfig {}

export const AppEmbed = componentFactory<
    typeof _AppEmbed,
    AppProps,
    AppViewConfig
>(_AppEmbed);

interface LiveboardProps extends EmbedProps, LiveboardViewConfig {}

export const LiveboardEmbed = componentFactory<
    typeof _LiveboardEmbed,
    LiveboardProps,
    LiveboardViewConfig
>(_LiveboardEmbed);

export const PinboardEmbed = componentFactory<
    typeof _LiveboardEmbed,
    LiveboardProps,
    LiveboardViewConfig
>(_LiveboardEmbed);

export const useEmbedRef = (): React.MutableRefObject<TsEmbed> => {
    return React.useRef<TsEmbed>(null);
};
