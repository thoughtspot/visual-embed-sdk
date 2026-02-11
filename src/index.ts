'use client';

/**
 * Copyright (c) 2023
 *
 * ThoughtSpot Visual Embed SDK for embedding ThoughtSpot analytics
 * in other web applications.
 * @summary ThoughtSpot Visual Embed SDK
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
import {
    AppEmbed,
    Page,
    AppViewConfig,
    HomePageSearchBarMode,
    PrimaryNavbarVersion,
    HomePage,
    ListPage,
    DataPanelCustomColumnGroupsAccordionState,
} from './embed/app';
import {
    init,
    prefetch,
    logout,
    executeTML,
    exportTML,
    executeTMLInput,
    exportTMLInput,
    reloadIframe,
} from './embed/base';
import { PinboardEmbed, LiveboardViewConfig, LiveboardEmbed } from './embed/liveboard';
import { SearchEmbed, SearchViewConfig } from './embed/search';
import { SearchBarEmbed, SearchBarViewConfig } from './embed/search-bar';
import { SpotterAgentEmbed, SpotterAgentEmbedViewConfig, BodylessConversation, BodylessConversationViewConfig} from './embed/bodyless-conversation';
import { SpotterEmbed, SpotterEmbedViewConfig, SpotterChatViewConfig, SpotterSidebarViewConfig, ConversationEmbed, ConversationViewConfig } from './embed/conversation';
import {
    AuthFailureType, AuthStatus, AuthEvent, AuthEventEmitter,
} from './auth';
import { getSessionInfo } from './utils/sessionInfoService';
import {
    AuthType,
    RuntimeFilter,
    RuntimeFilterOp,
    EmbedEvent,
    HostEvent,
    DataSourceVisualMode,
    Action,
    EmbedConfig,
    PrefetchFeatures,
    FrameParams,
    DOMSelector,
    HomeLeftNavItem,
    HomepageModule,
    MessageOptions,
    MessageCallback,
    MessagePayload,
    CustomisationsInterface,
    CustomStyles,
    customCssInterface,
    ContextMenuTriggerOptions,
    RuntimeParameter,
    LogLevel,
    VizPoint,
    CustomActionPayload,
    ListPageColumns,
    CustomActionsPosition,
    CustomActionTarget,
    InterceptedApiType,
    EmbedErrorCodes,
    EmbedErrorDetailsEvent, 
    ErrorDetailsTypes,
    ContextType,
} from './types';
import { CustomCssVariables } from './css-variables';
import { SageEmbed, SageViewConfig } from './embed/sage';
import { AnswerService, SessionInterface, UnderlyingDataPoint } from './utils/graphql/answerService/answerService';
import { getEmbedConfig } from './embed/embedConfig';
import { uploadMixpanelEvent, MIXPANEL_EVENT } from './mixpanel-service';
import { tokenizedFetch } from './tokenizedFetch';
import { getAnswerFromQuery } from './utils/graphql/nlsService/nls-answer-service';
import { createLiveboardWithAnswers } from './utils/liveboardService/liveboardService';
import { UIPassthroughEvent } from './embed/hostEventClient/contracts';

export {
    init,
    logout,
    prefetch,
    executeTML,
    exportTML,
    executeTMLInput,
    reloadIframe,
    exportTMLInput,
    getEmbedConfig as getInitConfig,
    getSessionInfo,
    tokenizedFetch,
    getAnswerFromQuery,
    createLiveboardWithAnswers,
    SearchEmbed,
    SearchBarEmbed,
    PinboardEmbed,
    LiveboardEmbed,
    SageEmbed,
    AppEmbed,
    SpotterAgentEmbed,
    SpotterAgentEmbedViewConfig,
    BodylessConversationViewConfig,
    BodylessConversation,
    SpotterEmbed,
    SpotterEmbedViewConfig,
    SpotterChatViewConfig,
    SpotterSidebarViewConfig,
    ConversationViewConfig,
    ConversationEmbed,
    AuthFailureType,
    AuthStatus,
    AuthEvent,
    AuthEventEmitter,
    AnswerService,
    // types
    SessionInterface,
    UnderlyingDataPoint,
    Page,
    AuthType,
    RuntimeFilter,
    RuntimeFilterOp,
    EmbedEvent,
    HostEvent,
    ContextType,
    DataSourceVisualMode,
    Action,
    ContextMenuTriggerOptions,
    EmbedConfig,
    SearchViewConfig,
    SearchBarViewConfig,
    LiveboardViewConfig,
    SageViewConfig,
    AppViewConfig,
    PrefetchFeatures,
    FrameParams,
    HomeLeftNavItem,
    HomepageModule,
    DOMSelector,
    MessageOptions,
    MessageCallback,
    MessagePayload,
    CustomisationsInterface,
    CustomStyles,
    customCssInterface,
    CustomCssVariables,
    RuntimeParameter,
    LogLevel,
    uploadMixpanelEvent,
    MIXPANEL_EVENT,
    HomePageSearchBarMode,
    PrimaryNavbarVersion,
    HomePage,
    ListPage,
    VizPoint,
    CustomActionPayload,
    UIPassthroughEvent,
    ListPageColumns,
    DataPanelCustomColumnGroupsAccordionState,
    CustomActionsPosition,
    CustomActionTarget,
    InterceptedApiType,
    EmbedErrorCodes,
    EmbedErrorDetailsEvent,
    ErrorDetailsTypes,
};

export { resetCachedAuthToken } from './authToken';
