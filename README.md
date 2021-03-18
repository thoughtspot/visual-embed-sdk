
<p align="center">
    <img src="https://raw.githubusercontent.com/thoughtspot/visual-embed-sdk/main/static/doc-images/images/TS-Logo-black-no-bg.svg" width=100 align="center" alt="ThoughtSpot" />
</p>

<br/>

# ThoughtSpot Visual Embed SDK  [![Coverage Status](https://coveralls.io/repos/github/ts-blink/embed-sdk/badge.svg?branch=main)](https://coveralls.io/github/ts-blink/embed-sdk?branch=main) [![CodeQL](https://github.com/thoughtspot/visual-embed-sdk/workflows/CodeQL/badge.svg)](https://github.com/thoughtspot/visual-embed-sdk/actions?query=workflow%3ACodeQL) ![npm (scoped)](https://img.shields.io/npm/v/@thoughtspot/visual-embed-sdk?style=flat-square)

SDK to embed ThoughtSpot into your web apps.

<br/>

## Usage

Via [NPM](https://www.npmjs.com/package/@thoughtspot/visual-embed-sdk):

```
npm i @thoughtspot/visual-embed-sdk
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
import * as TsEmbedSDK from '@thoughtspot/visual-embed-sdk';
```

## Full API Reference

Please visit our [API reference docs](https://docs.thoughtspot.com/visual-embed-sdk/typedoc/modules.html).


## Quick Start

The ThoughtSpot Embed SDK allows you to embed the ThoughtSpot search experience,
pinboards, visualizations or the even full app version.

### Embedded Search

```js
import { SearchEmbed, AuthType, init } from '@thoughtspot/visual-embed-sdk';

init({
    thoughtSpotHost: '<%=tshost%>',
    authType: AuthType.None,
});

const searchEmbed = new SearchEmbed(document.getElementById('ts-embed'), {
    frameParams: {
        width: '100%',
        height: '100%',
    },
});

searchEmbed.render();
```

### Embedded Pinboard & Visualization

```js
import {
    PinboardVizEmbed,
    AuthType,
    init,
} from '@thoughtspot/visual-embed-sdk';

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
        pinboardId: '<%=pinboardGUID%>',
        vizId: '<%=vizGUID%>',
    },
);

pinboardEmbed.render();
```

### Embedded Full App

```js
import { AppEmbed, Page, AuthType, init } from '@thoughtspot/visual-embed-sdk';

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
        page: Page.Data,
    });

appEmbed.render();
```
