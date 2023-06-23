import React from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { deepMerge } from '../utils';
import { SearchBarEmbed as _SearchBarEmbed, SearchBarViewConfig } from '../embed/search-bar';
import { SageEmbed as _SageEmbed, SageViewConfig } from '../embed/sage';
import { SearchEmbed as _SearchEmbed, SearchViewConfig } from '../embed/search';
import { AppEmbed as _AppEmbed, AppViewConfig } from '../embed/app';
import { LiveboardEmbed as _LiveboardEmbed, LiveboardViewConfig } from '../embed/liveboard';
import { TsEmbed } from '../embed/ts-embed';

import { EmbedEvent, ViewConfig } from '../types';
import { EmbedProps, getViewPropsAndListeners } from './util';

const componentFactory = <T extends typeof TsEmbed, U extends EmbedProps, V extends ViewConfig>(
    EmbedConstructor: T,
) => React.forwardRef<TsEmbed, U>(
    (props: U, forwardedRef: React.MutableRefObject<TsEmbed>) => {
        const ref = React.useRef<HTMLDivElement>(null);
        const { className, ...embedProps } = props;
        const { viewConfig, listeners } = getViewPropsAndListeners<
                Omit<U, 'className'>,
                V
            >(embedProps);
        useDeepCompareEffect(() => {
            const tsEmbed = new EmbedConstructor(
                    ref!.current,
                    deepMerge(
                        {
                            insertAsSibling: viewConfig.insertAsSibling,
                            frameParams: {
                                class: viewConfig.insertAsSibling
                                    ? className || ''
                                    : '',
                            },
                        },
                        viewConfig,
                    ),
            );
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
            return () => {
                tsEmbed.destroy();
            };
        }, [viewConfig, listeners]);

        return (
            (viewConfig.insertAsSibling)
                ? <span
                    data-testid="tsEmbed"
                    ref={ref}
                    style={{ position: 'absolute' }}
                ></span>
                : <div
                    data-testid="tsEmbed"
                    ref={ref}
                    className={className}>
                </div>
        );
    },
);

interface SearchProps extends EmbedProps, SearchViewConfig {}

/**
 * React component for Search Embed.
 *
 * @example
 * ```tsx
 * function Search() {
 *  return <SearchEmbed
 *      dataSource="dataSourceId"
 *      searchOptions={{ searchTokenString: "[revenue]" }}
 *  />
 * }
 * ```
 */
export const SearchEmbed = componentFactory<typeof _SearchEmbed, SearchProps, SearchViewConfig>(
    _SearchEmbed,
);

interface AppProps extends EmbedProps, AppViewConfig {}

/**
 * React component for Full app Embed.
 *
 * @example
 * ```tsx
 * function Search() {
 *  return <AppEmbed
 *      showPrimaryNavbar={false}
 *      pageId={Page.Liveboards}
 *      onError={(error) => console.error(error)}
 *  />
 * }
 * ```
 */
export const AppEmbed = componentFactory<typeof _AppEmbed, AppProps, AppViewConfig>(_AppEmbed);

interface LiveboardProps extends EmbedProps, LiveboardViewConfig {}

/**
 * React component for Liveboard embed.
 *
 * @example
 * ```tsx
 * function Liveboard() {
 *  return <LiveboardEmbed
 *      liveboardId="liveboardId"
 *      fullHeight={true} {/* default false *\/}
 *      onLiveboardRendered={() => console.log('Liveboard rendered')}
 *      vizId="vizId" {/* if doing viz embed *\/}
 *  />
 * }
 * ```
 */
export const LiveboardEmbed = componentFactory<
    typeof _LiveboardEmbed,
    LiveboardProps,
    LiveboardViewConfig
>(_LiveboardEmbed);

export const PinboardEmbed = LiveboardEmbed;

interface SearchBarEmbedProps extends EmbedProps, SearchBarViewConfig {}

/**
 * React component for Search bar embed.
 *
 * @example
 * ```tsx
 * function SearchBar() {
 *  return <SearchBarEmbed
 *      dataSource="dataSourceId"
 *      searchOptions={{ searchTokenString: "[revenue]" }}
 *  />
 * }
 * ```
 */
export const SearchBarEmbed = componentFactory<
    typeof _SearchBarEmbed,
    SearchBarEmbedProps,
    SearchBarViewConfig
>(_SearchBarEmbed);

interface SageEmbedProps extends EmbedProps, SageViewConfig {}

export const SageEmbed = componentFactory<
    typeof _SageEmbed,
    SageEmbedProps,
    SageViewConfig
>(_SageEmbed);

/**
 * Get a reference to the embed component to trigger events on the component.
 *
 * @example
 * ```
 * function Component() {
 * const ref = useEmbedRef();
 * useEffect(() => {
 * ref.current.trigger(
 *  EmbedEvent.UpdateRuntimeFilter,
 *  [{ columnName: 'name', operator: 'EQ', values: ['value']}]);
 * }, [])
 * return <LiveboardEmbed ref={ref} liveboardId={<id>} />
 * }
 * ```
 * @returns {React.MutableRefObject<TsEmbed>} ref
 */
export const useEmbedRef = (): React.MutableRefObject<TsEmbed> => React.useRef<TsEmbed>(null);

export {
    LiveboardViewConfig,
    SearchViewConfig,
    AppViewConfig,
    Page,
    RuntimeFilter,
    RuntimeFilterOp,
    EmbedEvent,
    HostEvent,
    Action,
    FrameParams,
} from '../index';
