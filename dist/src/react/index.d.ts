import React from 'react';
import { AuthEventEmitter } from '../auth';
import { SearchBarEmbed as _SearchBarEmbed, SearchBarViewConfig } from '../embed/search-bar';
import { SearchEmbed as _SearchEmbed, SearchViewConfig } from '../embed/search';
import { AppEmbed as _AppEmbed, AppViewConfig } from '../embed/app';
import { LiveboardEmbed as _LiveboardEmbed, LiveboardViewConfig } from '../embed/liveboard';
import { SpotterAgentEmbedViewConfig, ConversationMessage as _ConversationMessage, SpotterAgentMessageViewConfig } from '../embed/bodyless-conversation';
import { EmbedConfig } from '../types';
import { EmbedProps } from './util';
import { SpotterEmbed as _SpotterEmbed, SpotterEmbedViewConfig, ConversationEmbed as _ConversationEmbed, ConversationViewConfig } from '../embed/conversation';
interface SearchProps extends EmbedProps, SearchViewConfig {
}
interface PreRenderProps {
    /**
     * PreRender id to be used for PreRendering the embed.
     * Use PreRender to render the embed in the background and then
     * show or hide the rendered embed using showPreRender or hidePreRender respectively.
     *
     * Use PreRendered react component for pre rendering embed components.
     * @version SDK: 1.25.0 | ThoughtSpot: 9.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   preRenderId: "preRenderId-123"
     * });
     * embed.showPreRender();
     * ```
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
export declare const SearchEmbed: React.ForwardRefExoticComponent<SearchProps & React.RefAttributes<_SearchEmbed>>;
export declare const PreRenderedSearchEmbed: React.ForwardRefExoticComponent<SearchProps & PreRenderProps & React.RefAttributes<_SearchEmbed>>;
interface AppProps extends EmbedProps, AppViewConfig {
}
/**
 * React component for Full app Embed.
 * @example
 * ```tsx
 * function App() {
 *  return <AppEmbed
 *      showPrimaryNavbar={false}
 *      pageId={Page.Liveboards}
 *      onError={(error) => console.error(error)}
 *  />
 * }
 * ```
 */
export declare const AppEmbed: React.ForwardRefExoticComponent<AppProps & React.RefAttributes<_AppEmbed>>;
/**
 * React component for PreRendered App embed.
 *
 * PreRenderedAppEmbed will preRender the AppEmbed and will be hidden by
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
export declare const PreRenderedAppEmbed: React.ForwardRefExoticComponent<AppProps & PreRenderProps & React.RefAttributes<_AppEmbed>>;
interface LiveboardProps extends EmbedProps, LiveboardViewConfig {
}
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
export declare const LiveboardEmbed: React.ForwardRefExoticComponent<LiveboardProps & React.RefAttributes<_LiveboardEmbed>>;
export declare const PinboardEmbed: React.ForwardRefExoticComponent<LiveboardProps & React.RefAttributes<_LiveboardEmbed>>;
/**
 * React component for PreRendered Liveboard embed.
 *
 * PreRenderedLiveboardEmbed will preRender the liveboard and will be hidden by default.
 *
 * LiveboardEmbed with preRenderId passed will call showPreRender on the embed.
 *
 * If LiveboardEmbed is rendered before PreRenderedLiveboardEmbed is rendered it
 * tries to preRender the LiveboardEmbed, so it is recommended to pass the
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
export declare const PreRenderedLiveboardEmbed: React.ForwardRefExoticComponent<LiveboardProps & PreRenderProps & React.RefAttributes<_LiveboardEmbed>>;
export declare const PreRenderedPinboardEmbed: React.ForwardRefExoticComponent<LiveboardProps & PreRenderProps & React.RefAttributes<_LiveboardEmbed>>;
interface SearchBarEmbedProps extends EmbedProps, SearchBarViewConfig {
}
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
export declare const SearchBarEmbed: React.ForwardRefExoticComponent<SearchBarEmbedProps & React.RefAttributes<_SearchBarEmbed>>;
/**
 * React component for PreRendered SearchBar embed.
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
export declare const PreRenderedSearchBarEmbed: React.ForwardRefExoticComponent<SearchBarEmbedProps & PreRenderProps & React.RefAttributes<_SearchBarEmbed>>;
interface SpotterEmbedProps extends EmbedProps, SpotterEmbedViewConfig {
}
interface ConversationEmbedProps extends EmbedProps, ConversationViewConfig {
}
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
export declare const SpotterEmbed: React.ForwardRefExoticComponent<SpotterEmbedProps & React.RefAttributes<_SpotterEmbed>>;
/**
 * React component for LLM based conversation BI.
 * Use {@link SpotterEmbed} instead
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
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
export declare const ConversationEmbed: React.ForwardRefExoticComponent<ConversationEmbedProps & React.RefAttributes<_ConversationEmbed>>;
/**
 * React component for individual conversation messages from SpotterAgent.
 * This component is used internally by the useSpotterAgent hook.
 * @version SDK: 1.37.0 | ThoughtSpot: 10.9.0.cl
 */
interface ConversationMessageProps extends EmbedProps, SpotterAgentMessageViewConfig {
}
export declare const ConversationMessage: React.ForwardRefExoticComponent<ConversationMessageProps & React.RefAttributes<_ConversationMessage>>;
/**
 * React component for displaying individual conversation messages from SpotterAgent.
 *
 * This component renders a single message response from your ThoughtSpot conversation,
 * showing charts, visualizations, or text responses based on the user's query.
 *
 * @version SDK: 1.39.0 | ThoughtSpot: 10.11.0.cl
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
 */
export declare const SpotterMessage: React.ForwardRefExoticComponent<{
    message: SpotterAgentMessageViewConfig;
    query?: string;
} & Omit<EmbedProps, keyof SpotterAgentMessageViewConfig> & React.RefAttributes<_ConversationMessage>>;
/**
 * React component for PreRendered Conversation embed.
 *
 * PreRenderedConversationEmbed will preRender the SpotterEmbed and will be hidden by
 * default.
 *
 * SpotterEmbed with preRenderId passed will call showPreRender on the embed.
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
export declare const PreRenderedConversationEmbed: React.ForwardRefExoticComponent<SpotterEmbedProps & PreRenderProps & React.RefAttributes<_SpotterEmbed>>;
type EmbedComponent = typeof SearchEmbed | typeof AppEmbed | typeof LiveboardEmbed | typeof SearchBarEmbed | typeof ConversationMessage | typeof SpotterMessage | typeof SpotterEmbed | typeof ConversationEmbed;
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
export declare function useEmbedRef<T extends EmbedComponent>(): React.MutableRefObject<React.ComponentRef<T>>;
/**
 *
 * @version SDK: 1.36.2 | ThoughtSpot: *
 * @param config - EmbedConfig
 * @returns AuthEventEmitter
 * @example
 * ```
 * function Component() {
 *  const authEE = useInit({ ...initConfig });
 *  return <LiveboardEmbed ref={ref} liveboardId={<id>} />
 * }
 * ```
 */
export declare function useInit(config: EmbedConfig): React.MutableRefObject<AuthEventEmitter>;
/**
 * React hook for interacting with SpotterAgent AI conversations.
 *
 * This hook provides a sendMessage function that allows you to send natural language
 * queries to your data and get back AI-generated responses with visualizations.
 *
 * @version SDK: 1.39.0 | ThoughtSpot: 10.11.0.cl
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
 */
export declare function useSpotterAgent(config: SpotterAgentEmbedViewConfig): {
    sendMessage: (query: string) => Promise<{
        error: any;
        query?: undefined;
        message?: undefined;
    } | {
        query: string;
        message: {
            worksheetId: string;
            convId: any;
            messageId: any;
            sessionId: any;
            genNo: any;
            acSessionId: any;
            acGenNo: any;
        };
        error?: undefined;
    }>;
};
export { LiveboardViewConfig, SearchViewConfig, AppViewConfig, Page, RuntimeFilter, RuntimeFilterOp, EmbedEvent, HostEvent, Action, FrameParams, HomeLeftNavItem, HomepageModule, LogLevel, getSessionInfo, ListPageColumns, CustomActionsPosition, } from '../index';
//# sourceMappingURL=index.d.ts.map