# embed-sdk
[![Coverage Status](https://coveralls.io/repos/github/ts-blink/embed-sdk/badge.svg?branch=coverage-badge)](https://coveralls.io/github/ts-blink/embed-sdk?branch=coverage-badge)

ThoughtSpot Embed SDK

## Usage

```
npm i embed-sdk
```

```js
import { SearchEmbed, init } from 'embed-sdk';

init({
    thoughtSpotHost: '<%=tshost%>',
    authType: 'None'
});

const searchEmbed = new SearchEmbed(
    document.getElementById('ts-embed'), 
    {
        frameParams: {
            width: '100%',
            height: '100%'
        }
    });
searchEmbed.render({});

```
