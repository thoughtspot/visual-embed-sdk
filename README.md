<p align="center">
    <img src="https://raw.githubusercontent.com/thoughtspot/visual-embed-sdk/main/static/doc-images/images/TS-Logo-black-no-bg.svg" width=100 align="center" alt="ThoughtSpot" />
</p>

<br/>

# ThoughtSpot Visual Embed SDK [![Coverage Status](https://coveralls.io/repos/github/ts-blink/embed-sdk/badge.svg?branch=main)](https://coveralls.io/github/ts-blink/embed-sdk?branch=main) ![npm (scoped with tag)](https://img.shields.io/npm/v/@thoughtspot/visual-embed-sdk) [![](https://data.jsdelivr.com/v1/package/npm/@thoughtspot/visual-embed-sdk/badge?style=rounded)](https://www.jsdelivr.com/package/npm/@thoughtspot/visual-embed-sdk)

SDK to embed ThoughtSpot into your web apps.

<br/>

## Usage

The SDK is compatible with ThoughtSpot SW version >= 7.1 and ThoughtSpot Cloud.

Install the Visual Embed SDK from [NPM](https://www.npmjs.com/package/@thoughtspot/visual-embed-sdk):

```
npm i @thoughtspot/visual-embed-sdk
```

The SDK is written in TypeScript and is also provided both as ES Module (ESM) and Universal Module Definition (UMD) modules, allowing you to use it in a variety of environments. For example,...

```js
// ESM via NPM
import * as TsEmbedSDK from '@thoughtspot/visual-embed-sdk';
// OR
import { LiveboardEmbed } from '@thoughtspot/visual-embed-sdk';

// NPM <script>
<script src="https://cdn.jsdelivr.net/npm/@thoughtspot/visual-embed-sdk/dist/tsembed.js"></script>;

// ES6 from web
import {
    LiveboardEmbed,
    AuthType,
    init,
} from 'https://cdn.jsdelivr.net/npm/@thoughtspot/visual-embed-sdk/dist/tsembed.es.js';
```

<br/>

## Live Playground

Visit our [code playground](https://try-everywhere.thoughtspot.cloud/v2/#/everywhere). <br/><br/>
Start a [free trial](https://www.thoughtspot.com/trial?tsref=trialtse) on your own data.

<br/>

## Full API Reference

-   Detailed [developer guide](https://try-everywhere.thoughtspot.cloud/v2/#/everywhere/documentation/en/?pageid=getting-started).
-   Please visit our [API reference docs](https://developers.thoughtspot.com/docs/typedoc/modules.html).

<br/>

## Quick Start

The ThoughtSpot Embed SDK allows you to embed the ThoughtSpot search experience,
liveboards, visualizations or the even full app version.

### Embedded Search

```js
// NPM
import { SearchEmbed, AuthType, init } from '@thoughtspot/visual-embed-sdk';
// or ES6
// import { SearchEmbed, AuthType, init } from 'https://cdn.jsdelivr.net/npm/@thoughtspot/visual-embed-sdk/dist/tsembed.es.js';

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

### Embedded Liveboard & Visualization

```js
// NPM
import { LiveboardEmbed, AuthType, init } from '@thoughtspot/visual-embed-sdk';
// or ES6
// import { LiveboardEmbed, AuthType, init } from 'https://cdn.jsdelivr.net/npm/@thoughtspot/visual-embed-sdk/dist/tsembed.es.js';

init({
    thoughtSpotHost: '<%=tshost%>',
    authType: AuthType.None,
});

const liveboardEmbed = new LiveboardEmbed(
    document.getElementById('ts-embed'),
    {
        frameParams: {
            width: '100%',
            height: '100%',
        },
        liveboardId: '<%=liveboardGUID%>',
        vizId: '<%=vizGUID%>',
    },
});

liveboardEmbed.render();
```

### Embedded Full App

```js
// NPM
import { AppEmbed, Page, AuthType, init } from '@thoughtspot/visual-embed-sdk';
// or ES6
// import { AppEmbed, AuthType, init } from 'https://cdn.jsdelivr.net/npm/@thoughtspot/visual-embed-sdk/dist/tsembed.es.js';

init({
    thoughtSpotHost: '<%=tshost%>',
    authType: AuthType.None,
});

const appEmbed = new AppEmbed(document.getElementById('ts-embed'), {
    frameParams: {
        width: '100%',
        height: '100%',
    },
    pageId: Page.Data,
});

appEmbed.render();
```

## React Components

All the above flavors of embedding are also provided as React components for your convenience.
The constructor options are passed as props and the event listeners can be attached using `on<EventName>` convention.
<br/><br/>
Checkout a comprehensive working demo [here](https://codesandbox.io/s/github/ashubham/big-react-demo)

### Search Component

```js
import { init } from '@thoughtspot/visual-embed-sdk';
import { SearchEmbed } from '@thoughtspot/visual-embed-sdk/react';

// If you are using Webpack 4 (which is the default when using create-react-app v4), you would need to import
// the React components using the below:
import { SearchEmbed } from '@thoughtspot/visual-embed-sdk/lib/src/react';

init({
    thoughtSpotHost: '<%=tshost%>',
    authType: AuthType.None,
});

const MyComponent = ({ dataSources }) => {
    const onCustomAction = (actionEvent) => {
        // Do something with actionEvent.
    };

    return (
        <SearchEmbed
            dataSources={dataSources}
            onCustomAction={onCustomAction}
        />
    );
};
```

### Triggering events on React components (> version 1.9.2)

```jsx
import { HostEvent } from '@thoughtspot/visual-embed-sdk';
import { LiveboardEmbed, useEmbedRef } from '@thoughtspot/visual-embed-sdk/react';

const MyComponent = () => {
    const embedRef = useEmbedRef();
    const onLiveboardRendered = () => {
        embedRef.current.trigger(HostEvent.SetVisibleVizs, ['viz1', 'viz2']);
    };

    return (
        <LiveboardEmbed
            ref={embedRef}
            liveboardId="<liveboard-guid>"
            onLiveboardRendered={onLiveboardRendered}
        />
    );
};
```

###

<br/>
<br/>

Visual-Embed-SDK, © ThoughtSpot, Inc. 2022
