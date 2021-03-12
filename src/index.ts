/**
 * Copyright (c) 2020
 *
 * ThoughtSpot Embed UI SDK for embedding ThoughtSpot analytics
 * in other web applications.
 *
 * @summary ThoughtSpot Embed UI SDK
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { AppEmbed, Page, AppViewConfig } from './embed/app';
import { init } from './embed/base';
import { PinboardEmbed, PinboardViewConfig } from './embed/pinboard';
import { SearchEmbed, SearchViewConfig } from './embed/search';
import {
    AuthType,
    RuntimeFilter,
    RuntimeFilterOp,
    EmbedEvent,
    HostEvent,
    DataSourceVisualMode,
    Action,
    EmbedConfig,
} from './types';

export {
    init,
    SearchEmbed,
    PinboardEmbed,
    AppEmbed,
    // types
    Page,
    AuthType,
    RuntimeFilter,
    RuntimeFilterOp,
    EmbedEvent,
    HostEvent,
    DataSourceVisualMode,
    Action,
    EmbedConfig,
    SearchViewConfig,
    PinboardViewConfig,
    AppViewConfig,
};
