'use client';

import React, { useRef, useCallback } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { AuthEventEmitter } from '../auth';
import { deepMerge } from '../utils';
import { SearchBarEmbed as _SearchBarEmbed, SearchBarViewConfig } from '../embed/search-bar';
import { SageEmbed as _SageEmbed, SageViewConfig } from '../embed/sage';
import { SearchEmbed as _SearchEmbed, SearchViewConfig } from '../embed/search';
import { AppEmbed as _AppEmbed, AppViewConfig } from '../embed/app';
import { LiveboardEmbed as _LiveboardEmbed, LiveboardViewConfig } from '../embed/liveboard';
import { TsEmbed } from '../embed/ts-embed';
import { SpotterAgentEmbed as _SpotterAgentEmbed, SpotterAgentEmbedViewConfig, ConversationMessage as _ConversationMessage, SpotterAgentMessageViewConfig } from '../embed/bodyless-conversation';

import { EmbedConfig, EmbedEvent, AllEmbedViewConfig } from '../types';
import { EmbedProps, getViewPropsAndListeners } from './util';
import { SpotterEmbed as _SpotterEmbed, SpotterEmbedViewConfig, ConversationEmbed as _ConversationEmbed, ConversationViewConfig } from '../embed/conversation';
import { init } from '../embed/base';
import { ERROR_MESSAGE } from '../errors';

const componentFactory = <T extends typeof TsEmbed, U extends EmbedProps, V extends AllEmbedViewConfig>(
    EmbedConstructor: T,
    // isPreRenderedComponent: Specifies whether the component being returned is
    // intended for preRendering. If set to true, the component will call the
    // Embed.preRender() method instead of the usual render method, and it will
    // not be destroyed when the component is unmounted.
    isPreRenderedComponent = false,
 ) => React.forwardRef<InstanceType<T>, U>(
    (props: U, forwardedRef: React.MutableRefObject<InstanceType<T>>) => {
        const ref = React.useRef<HTMLDivElement>(null);
        const { className, style, ...embedProps } = props;
        const { viewConfig, listeners } = getViewPropsAndListeners<Omit<U, 'className' | 'style'>, V>(
            embedProps,
        );

        const handleDestroy = (tsEmbed: InstanceType<T>) => {
            // do not destroy if it is a preRender component
            if (isPreRenderedComponent) return;

            // if component is connected to a preRendered component
            if (props.preRenderId) {
                tsEmbed.hidePreRender();
                return;
            }

            tsEmbed.destroy();
        };

        const handlePreRenderRendering = (tsEmbed: InstanceType<T>) => {
            tsEmbed.preRender();
        };

        const handleDefaultRendering = (tsEmbed: InstanceType<T>) => {
            // if component is connected to a preRendered component
            if (props.preRenderId) {
                tsEmbed.showPreRender();
                return;
            }

            tsEmbed.render();
        };

        const handleRendering = (tsEmbed: InstanceType<T>) => {
            if (isPreRenderedComponent) {
                handlePreRenderRendering(tsEmbed);
                return;
            }
            handleDefaultRendering(tsEmbed);
        };

        useDeepCompareEffect(() => {
            const tsEmbed = new EmbedConstructor(
                ref!.current,
                deepMerge(
                    {
                        insertAsSibling: viewConfig.insertAsSibling,
                        frameParams: {
                            class: viewConfig.insertAsSibling ? className || '' : '',
                        },
                    },
                    viewConfig,
                ),
            ) as InstanceType<T>;
            Object.keys(listeners).forEach((eventName) => {
                tsEmbed.on(eventName as EmbedEvent, listeners[eventName as EmbedEvent]);
            });
            handleRendering(tsEmbed);
            if (forwardedRef) {
                // eslint-disable-next-line no-param-reassign
                forwardedRef.current = tsEmbed;
            }
            return () => {
                handleDestroy(tsEmbed);
            };
        }, [viewConfig, listeners]);

        const preRenderStyles = isPreRenderedComponent ? { display: 'none' } : {};

        return viewConfig.insertAsSibling ? (
            <span data-testid="tsEmbed" ref={ref} style={{ position: 'absolute', ...preRenderStyles }}></span>
        ) : (
            <div data-testid="tsEmbed" ref={ref} style={{ ...style, ...preRenderStyles }} className={`ts-embed-container ${className}`}></div>
        );
    },
);

interface SearchProps extends EmbedProps, SearchViewConfig { }

interface PreRenderProps {
    /**
     * PreRender id to be used for PreRendering the embed.
     * Use PreRender to render the embed in the background and then
     * show or hide the rendered embed using showPreRender or hidePreRender respectively.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   preRenderId: "preRenderId-123"
     * });
     * embed.showPreRender();
     * ```
     *
     * Use PreRendered react component for pre rendering embed components.
     * @example
     * ```tsx
     * function LandingPageComponent() {
     *  return <PreRenderedLiveboardEmbed preRenderId="someId" liveboardId="libId" />
     * }
     * ```
     * function MyComponent() {
     *  return <LiveboardEmbed preRenderId="someId" liveboardId="libId" />
     * }
     * ```
     * @version SDK: 1.25.0 | Thoughtspot: 9.6.0.cl
     */
    preRenderId: string;
}

/**
 * React component for Search Embed.
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

export const PreRenderedSearchEmbed = componentFactory<
    typeof _SearchEmbed,
    SearchProps & PreRenderProps,
    SearchViewConfig
>(_SearchEmbed, true);

interface AppProps extends EmbedProps, AppViewConfig { }

/**
 * React component for Full app Embed.
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

/**
 * React component for PreRendered Liveboard embed.
 *
 * PreRenderedAppEmbed will preRender the SearchBarEmbed and will be hidden by
 * default.
 *
 * AppEmbed with preRenderId passed will call showPreRender on the embed.
 * @example
 * ```tsx
 * function LandingPageComponent() {
 *  return <PreRenderedAppEmbed preRenderId="someId" showPrimaryNavbar={false} />
 * }
 * ```
 * function MyComponent() {
 *  return <AppEmbed preRenderId="someId" showPrimaryNavbar={false} />
 * }
 * ```
 */
export const PreRenderedAppEmbed = componentFactory<
    typeof _AppEmbed,
    AppProps & PreRenderProps,
    AppViewConfig
>(_AppEmbed, true);

interface LiveboardProps extends EmbedProps, LiveboardViewConfig { }

/**
 * React component for Liveboard embed.
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

/**
 * React component for PreRendered Liveboard embed.
 *
 * PreRenderedLiveboardEmbed will preRender the liveboard and will be hidden by default.
 *
 * LiveboardEmbed with preRenderId passed will call showPreRender on the embed.
 *
 * If LiveboardEmbed is rendered before PreRenderedLiveboardEmbed is rendered it
 * tries to preRender the LiveboardEmbed, so it is recommended to use pass the
 * liveboardId to both the components.
 * @example
 * ```tsx
 * function LandingPageComponent() {
 *  return <PreRenderedLiveboardEmbed preRenderId="someId" liveboardId="libId" />
 * }
 * ```
 * function MyComponent() {
 *  return <LiveboardEmbed preRenderId="someId" liveboardId="libId" />
 * }
 * ```
 */
export const PreRenderedLiveboardEmbed = componentFactory<
    typeof _LiveboardEmbed,
    LiveboardProps & PreRenderProps,
    LiveboardViewConfig
>(_LiveboardEmbed, true);

export const PreRenderedPinboardEmbed = PreRenderedLiveboardEmbed;

interface SearchBarEmbedProps extends EmbedProps, SearchBarViewConfig { }

/**
 * React component for Search bar embed.
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

/**
 * React component for PreRendered Liveboard embed.
 *
 * PreRenderedSearchBarEmbed will preRender the SearchBarEmbed and will be hidden by
 * default.
 *
 * SearchBarEmbed with preRenderId passed will call showPreRender on the embed.
 * @example
 * ```tsx
 * function LandingPageComponent() {
 *  return <PreRenderedSearchBarEmbed preRenderId="someId"  dataSource="dataSourceId" />
 * }
 * ```
 * function MyComponent() {
 *  return <SearchBarEmbed preRenderId="someId"  dataSource="dataSourceId" />
 * }
 * ```
 */
export const PreRenderedSearchBarEmbed = componentFactory<
    typeof _SearchBarEmbed,
    SearchBarEmbedProps & PreRenderProps,
    SearchBarViewConfig
>(_SearchBarEmbed, true);

interface SageEmbedProps extends EmbedProps, SageViewConfig { }

/**
 * React component for LLM based search Sage embed.
 * @example
 * ```tsx
 * function Sage() {
 *  return <SageEmbed
 *      showObjectResults={true}
 *      ... other view config props or event listeners.
 *  />
 * }
 * ```
 */
export const SageEmbed = componentFactory<typeof _SageEmbed, SageEmbedProps, SageViewConfig>(
    _SageEmbed,
);

/**
 * React component for PreRendered Liveboard embed.
 *
 * PreRenderedSageEmbed will preRender the SearchBarEmbed and will be hidden by
 * default.
 *
 * SageEmbed with preRenderId passed will call showPreRender on the embed.
 * @example
 * ```tsx
 * function LandingPageComponent() {
 *  return <PreRenderedSageEmbed preRenderId="someId" showObjectResults={true} />
 * }
 * ```
 * function MyComponent() {
 *  return <SageEmbed preRenderId="someId" showObjectResults={true} />
 * }
 * ```
 */
export const PreRenderedSageEmbed = componentFactory<
    typeof _SageEmbed,
    SageEmbedProps & PreRenderProps,
    SageViewConfig
>(_SageEmbed, true);

interface SpotterEmbedProps extends EmbedProps, SpotterEmbedViewConfig { }
interface ConversationEmbedProps extends EmbedProps, ConversationViewConfig { }

/**
 * React component for LLM based conversation BI.
 * @example
 * ```tsx
 * function Sage() {
 *  return <SpotterEmbed
 *      worksheetId="<worksheet-id-here>"
 *      searchOptions={{
 *          searchQuery: "<search query to start with>"
 *      }}
 *      ... other view config props or event listeners.
 *  />
 * }
 * ```
 */
export const SpotterEmbed = componentFactory<
    typeof _SpotterEmbed,
    SpotterEmbedProps,
    SpotterEmbedViewConfig
>(_SpotterEmbed);


/**
 * React component for LLM based conversation BI.
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
 * Use {@link SpotterEmbed} instead
 * @example
 * ```tsx
 * function Sage() {
 *  return <ConversationEmbed
 *      worksheetId="<worksheet-id-here>"
 *      searchOptions={{
 *          searchQuery: "<search query to start with>"
 *      }}
 *      ... other view config props or event listeners.
 *  />
 * }
 * ```
 */
export const ConversationEmbed = componentFactory<
    typeof _ConversationEmbed,
    ConversationEmbedProps,
    ConversationViewConfig
>(_ConversationEmbed);

/**
 * React component for individual conversation messages from SpotterAgent.
 * This component is used internally by the useSpotterAgent hook.
 * @version SDK: 1.37.0 | ThoughtSpot: 10.9.0.cl
 */
interface ConversationMessageProps extends EmbedProps, SpotterAgentMessageViewConfig {}

export const ConversationMessage = componentFactory<
    typeof _ConversationMessage,
    ConversationMessageProps,
    SpotterAgentMessageViewConfig
>(_ConversationMessage);

type SpotterMessageProps = {
    message: SpotterAgentMessageViewConfig;
    query?: string;
  } & Omit<EmbedProps, keyof SpotterAgentMessageViewConfig>;

/**
 * React component for displaying individual conversation messages from SpotterAgent.
 * 
 * This component renders a single message response from your ThoughtSpot conversation,
 * showing charts, visualizations, or text responses based on the user's query.
 * 
 * @example
 * ```tsx
 * const { sendMessage } = useSpotterAgent({ worksheetId: 'worksheetId' });
 * const result = await sendMessage('show me sales by region');
 * 
 * if (!result.error) {
 *   // Simple usage - just pass the message data
 *   <SpotterMessage message={result.message} />
 *   
 *   // With optional query for context
 *   <SpotterMessage 
 *     message={result.message} 
 *     query={result.query} 
 *   />
 * }
 * ```
 * @version SDK: 1.39.0 | ThoughtSpot: 10.11.0.cl
 */
export const SpotterMessage = React.forwardRef<
    React.ComponentRef<typeof ConversationMessage>,
    SpotterMessageProps
>((props, ref) => {
    const { message, query: _, ...otherProps } = props;
    
    return (
        <ConversationMessage
            ref={ref}
            {...message}
            {...otherProps}
        />
    );
});

/**
 * React component for PreRendered Conversation embed.
 *
 * PreRenderedConversationEmbed will preRender the SpotterEmbed and will be hidden by
 * default.
 *
 * SageEmbed with preRenderId passed will call showPreRender on the embed.
 * @example
 * ```tsx
 * function LandingPageComponent() {
 *  return <PreRenderedConversationEmbed preRenderId="someId" worksheetId={"id-"} />
 * }
 * ```
 * function MyComponent() {
 *  return <SpotterEmbed preRenderId="someId" worksheetId="id" />
 * }
 * ```
 */
export const PreRenderedConversationEmbed = componentFactory<
    typeof _SpotterEmbed,
    SpotterEmbedProps & PreRenderProps,
    SpotterEmbedViewConfig
>(_SpotterEmbed, true);

type EmbedComponent = typeof SearchEmbed
    | typeof AppEmbed
    | typeof LiveboardEmbed
    | typeof SearchBarEmbed
    | typeof SageEmbed
    | typeof ConversationMessage
    | typeof SpotterMessage
    | typeof SpotterEmbed
    | typeof ConversationEmbed;

/**
 * Get a reference to the embed component to trigger events on the component.
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
 * @returns {React.MutableRefObject<T extends TsEmbed>} ref
 */
export function useEmbedRef<T extends EmbedComponent>():
    React.MutableRefObject<React.ComponentRef<T>> {
    return React.useRef<React.ComponentRef<T>>(null);
}

/**
 *
 * @param config - EmbedConfig
 * @returns AuthEventEmitter
 * @example
 * ```
 * function Component() {
 *  const authEE = useInit({ ...initConfig });
 *  return <LiveboardEmbed ref={ref} liveboardId={<id>} />
 * }
 * ```
 * @version SDK: 1.36.2 | ThoughtSpot: *
 */
export function useInit(config: EmbedConfig) {
    const ref = useRef<AuthEventEmitter | null>(null);
    useDeepCompareEffect(() => {
        const authEE = init(config);
        ref.current = authEE;
    }, [config]);

    return ref;
}

/**
 * React hook for interacting with SpotterAgent AI conversations.
 * 
 * This hook provides a sendMessage function that allows you to send natural language
 * queries to your data and get back AI-generated responses with visualizations.
 * 
 * @param config - Configuration object containing worksheetId and other options
 * @returns Object with sendMessage function that returns conversation results
 * @example
 * ```tsx
 * const { sendMessage } = useSpotterAgent({ worksheetId: 'worksheetId' });
 * 
 * const handleQuery = async () => {
 *   const result = await sendMessage('show me sales by region');
 *   
 *   if (!result.error) {
 *     // Display the message response
 *     <SpotterMessage message={result.message} />
 *   } else {
 *     console.error('Error:', result.error);
 *   }
 * };
 * ```
 * @version SDK: 1.39.0 | ThoughtSpot: 10.11.0.cl
 */
export function useSpotterAgent(config: SpotterAgentEmbedViewConfig) {
    const serviceRef = useRef<_SpotterAgentEmbed | null>(null);
    
    useDeepCompareEffect(() => {
        if (serviceRef.current) {
            serviceRef.current = null;
        }
        
        serviceRef.current = new _SpotterAgentEmbed(config);
        
        return () => {
            serviceRef.current = null;
        };
    }, [config]);

    const sendMessage = useCallback(async (query: string) => {
        if (!serviceRef.current) {
            return { error: new Error(ERROR_MESSAGE.SPOTTER_AGENT_NOT_INITIALIZED) };
        }

        const result = await serviceRef.current.sendMessageData(query);

        if (result.error) {
            return { error: result.error };
        }

        return {
            query: query,
            message: {
                ...result.data,
                worksheetId: config.worksheetId,
            },
        };
    }, [config.worksheetId]);

    return {
        sendMessage,
    };
}

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
    HomeLeftNavItem,
    HomepageModule,
    LogLevel,
    getSessionInfo,
    ListPageColumns,
    CustomActionsPosition,
} from '../index';
