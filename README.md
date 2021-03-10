# ThoughtSpot Visual Embed SDK

[![Coverage Status](https://coveralls.io/repos/github/ts-blink/embed-sdk/badge.svg?branch=main)](https://coveralls.io/github/ts-blink/embed-sdk?branch=main)

ThoughtSpot Embed SDK

## Usage

Via [NPM](https://www.npmjs.com/package/@thoughtspot/embed-sdk):

```
npm i @thoughtspot/embed-sdk
```

The SDK is written in TypeScript and is also provided both as ESM and UMD module,
allowing you to use it in a variety of environments, e.g.,

```js
// CommonJS
var TsEmbedSDK = require('tsembed');

// RequireJS (AMD)
define(['tsembed'], function (TsEmbedSDK) {
    // ...
});

// Global
var TsEmbedSDK = window.tsembed;

// ESM
import * as TsEmbedSDK from 'tsembed.es';
```

## Embed Flavours

The ThoughtSpot Embed SDK allows you to embed the ThoughtSpot search experience,
pinboards, visualizations or the even full app version.

### Embedded Search

```js
import { SearchEmbed, AuthType, init } from '@thoughtspot/embed-sdk';

init({
    thoughtSpotHost: '<%=tshost%>',
    authType: AuthType.None,
});

const searchEmbed = new SearchEmbed(
    document.getElementById('ts-embed'),
    {
        frameParams: {
            width: '100%',
            height: '100%',
        },
    });

searchEmbed.render({});
```

### Embedded Pinboard & Visualization

```js
import { PinboardVizEmbed, AuthType, init } from '@thoughtspot/embed-sdk';

init({
    thoughtSpotHost: '<%=tshost%>',
    authType: AuthType.None,
});

const pinboardEmbed = new PinboardVizEmbed(
    document.getElementById('ts-embed'),
    {
        frameParams: {
            width: '100%',
            height: '100%',
        },
    });

pinboardEmbed.render({
    pinboardId: '<%=pinboardGUID%>',
    vizId: '<%=vizGUID%>'
});
```

### Embedded Full App

```js
import { AppEmbed, Page, AuthType, init } from '@thoughtspot/embed-sdk';

init({
    thoughtSpotHost: '<%=tshost%>',
    authType: AuthType.None,
});

const appEmbed = new AppEmbed(
    document.getElementById('ts-embed'),
    {
        frameParams: {
            width: '100%',
            height: '100%',
        },
    });

appEmbed.render({
    Page.Data
});
```
