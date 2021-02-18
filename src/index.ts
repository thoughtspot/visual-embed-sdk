/**
 * Copyright (c) 2020
 *
 * ThoughtSpot Embed UI SDK for embedding ThoughtSpot analytics
 * in other web applications.
 *
 * @summary ThoughtSpot Embed UI SDK
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { AppEmbed, Page } from './embed/app';
import { init } from './embed/base';
import { PinboardEmbed } from './embed/pinboard';
import { SearchEmbed } from './embed/search';
import {
    AuthType,
    RuntimeFilterOp,
    EventType,
    DataSourceVisualMode,
    Action,
} from './types';

export {
    init,
    SearchEmbed,
    PinboardEmbed,
    AppEmbed,
    // types
    Page,
    AuthType,
    RuntimeFilterOp,
    EventType,
    DataSourceVisualMode,
    Action,
};
