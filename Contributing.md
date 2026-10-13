## Contribution guide

### Requirements

- NodeJS 18.x / npm 9.x

### Cloning and making changes

```
$ git clone https://github.com/thoughtspot/visual-embed-sdk
$ npm i --legacy-peer-deps
```

All the code is in the `src` directory.

### Code structure

#### Components

All components are exposed as Classes which extend from the `TsEmbed` class. Blink V1 based components
extend from `V1Embed` class. These based classes are defined in `src/embed/ts-embed.ts`.

The named components are exposed from the named files `src/embed/app.ts`, `src/embed/liveboard.ts` etc.

#### Events

There are two kinds of events `HostEvents` and `EmbedEvents`.

- HostEvents: Host application => ThoughtSpot.
- EmbedEvents: ThoughtSpot => Host application.

All the events are listed in `src/types.ts`. 

#### Actions

These are all the actions in the TS application, like "Save", "MakeACopy" etc. Listed in `src/types.ts`.

### Contributing event types

Event payload types in this SDK are the **public, curated** view of a wire
contract whose shapes originate in the ThoughtSpot host application. The two
sides are maintained separately and can drift, so adding or changing an event
means updating both. This section is the checklist.

The SDK is only ever a consumer/sender of the wire protocol: it *sends* host
events and *receives* embed events. The host validates host events and produces
embed-event payloads, so the shapes are authored there first, then mirrored here.

#### Host events (outbound — `embed.trigger()`)

The typed request per host event lives in
`src/contracts/host-event-contracts.ts` (`HostEventRequestMap`), and the
customer-facing docs live on the `HostEvent` enum members in `src/types.ts`.

To add or change one:

1. Add or edit the request interface in `host-event-contracts.ts` and map it in
   `HostEventRequestMap` under the `HostEvent` member.
2. On the `HostEvent` enum member in `src/types.ts`, add a `Payload: {@link
   XRequest}.` line so the docs link to the type. No-payload events say
   `Payload: none.`.
3. Export any new interface from `src/index.ts` **and** `src/react/all-types-export.ts`
   (the React surface is a hand-maintained duplicate; the parity test enforces it).
4. Add the event's wire value to the stable list in
   `src/contracts/contracts.spec.ts`. That list is an additive-only lock: a
   removed or renamed value is a breaking change, not a refactor.

`trigger()` accepts an all-optional (`DeepPartial`) view of the request today;
required-field strictness is planned for a later major and is called out in the
doc comments. Keep new fields optional unless you intend to break callers.

#### Embed events (inbound — `embed.on()`)

The typed payload per embed event lives in
`src/contracts/embed-event-payloads.ts` (`EmbedEventDataExtension`). `on()` and
the React `on{Event}` props deliver it automatically, so once an event is in the
map, consumers get it typed with no further wiring.

To add or change one:

1. Add a payload interface, composing from the scope mixins
   (`LiveboardScope`, `VizScope`, `AnswerScope`, …) where the shape is shared,
   and map it in `EmbedEventDataExtension` under the `EmbedEvent` member.
2. Keep it **loose**: fields optional, and the base's `[key: string]: any` index
   signature lets a callback read fields the host also sends without breaking.
   Codify what the host actually sends, not what the docs say.
3. Add the event's wire value to the stable list in `contracts.spec.ts` (same
   additive-only rule as host events).

#### Mirroring

Because the shapes originate in the host app, a new event or a changed payload
there needs a matching update here. The two repos are kept in sync by hand — the
host app's `embed-event-schema` names this SDK file to update, and the same in
reverse. There is no build-time coupling between the repos (by design, so each
ships on its own release), so treat a divergence you spot as a defect to fix
here, and mirror any host-app change into the map above.

### Documentation

All publicly exposed methods, events, actions, classes, enums and interfaces should have JSDoc clearly explaining their
purpose and usage. The doc should have the following tags:

- Description
- @params (if a method which takes params)
- @return (if a method which returns a value)
- @version (Version this member is available since, both TS and the SDK version)
- @example (an example of how this member could be used in code).

Check [this](https://github.com/thoughtspot/visual-embed-sdk/blob/main/src/embed/base.ts#L143_ for example.


### Building and Testing

Once you have made changes, we should add a test to make sure the change is tested. If the test is not added
and the coverage falls below the threshold the PR will fail sanity.

All tests are written using `jest`. And are written in a file named `<file>.spec.ts` corresponding to any module named
`file`. This file is colocated with the module.

The tests can be run using:

```
$ npm test
```

#### Testing an unreleased version

To test an unreleased version of the SDK you have a few options:

*Locally:*
- Use `npm link`, to test the sdk against a local application.

*Codesanbox:*
- Publish a new version of the SDK with a tag.
- To publish you may need to be given permission, by adding yourself to the `developers` group on `npm`.
    - Set the version in the `package.json` file to a version with a scheme like `1.<currentMinor>.0-<tagname>.<buildnum>`.
      For eg, `1.21.0-mytest.2`.
    - `npm publish --tag mytest`.

#### Testing against a live application.

There are a few options here:

1. Use with this [example](https://github.com/thoughtspot/visual-embed-sdk/tree/main/examples/app-with-custom-actions) app.
2. Fork and use the embed [codesandbox](https://codesandbox.io/s/big-tse-react-demo-i4g9xi)
3. The clover bank demo [app](https://github.com/ts-blink/clover-bank).

Once the changes are made and tests are written, raise a PR against the `main` branch of this repo. Please make sure to include
the `JIRA` id in the commit message. Request members on the  ThoughtSpot Embedded team to review your PR. The sanity tests should run automatically. 
Once everything is complete, you should be able to merge the PR.


