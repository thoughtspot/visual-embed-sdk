
<p align="center">
    <img src="https://raw.githubusercontent.com/thoughtspot/visual-embed-sdk/main/static/doc-images/images/TS-Logo-black-no-bg.svg" width=100 align="center" alt="ThoughtSpot" />
</p>

<br/>

# ThoughtSpot Visual Embed SDK  [![Coverage Status](https://coveralls.io/repos/github/ts-blink/embed-sdk/badge.svg?branch=main)](https://coveralls.io/github/ts-blink/embed-sdk?branch=main) ![npm (scoped with tag)](https://img.shields.io/npm/v/@thoughtspot/visual-embed-sdk)

SDK to embed ThoughtSpot into your web apps.

<br/>

## Usage

Install the Visual Embed SDK from [NPM](https://www.npmjs.com/package/@thoughtspot/visual-embed-sdk):

```
npm i @thoughtspot/visual-embed-sdk
```

The SDK is written in TypeScript and is also provided both as ES Module (ESM) and Universal Module Definition (UMD) modules, allowing you to use it in a variety of environments. For example,...

```js
// ESM
import * as TsEmbedSDK from '@thoughtspot/visual-embed-sdk';

// <script>
<script src='https://unpkg.com/@thoughtspot/visual-embed-sdk/dist/tsembed.js'></script>
```
<br/>

## Live Playground

Visit our [code playground](https://try-everywhere.thoughtspot.cloud/v2/#/everywhere).

<br/>

## Full API Reference

Please visit our [API reference docs](https://docs.thoughtspot.com/visual-embed-sdk/release/typedoc/modules.html).

<br/>

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
import { PinboardEmbed, AuthType, init } from '@thoughtspot/visual-embed-sdk';

init({
    thoughtSpotHost: '<%=tshost%>',
    authType: AuthType.None,
});

const pinboardEmbed = new PinboardEmbed(
    document.getElementById('ts-embed'),
    {
        frameParams: {
            width: '100%',
            height: '100%',
        },
        pinboardId: '<%=pinboardGUID%>',
        vizId: '<%=vizGUID%>',
    },
});

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
        pageId: Page.Data,
    });

appEmbed.render();
```

<br/>
<br/>

Visual-Embed-SDK, © ThoughtSpot, Inc. 2021
