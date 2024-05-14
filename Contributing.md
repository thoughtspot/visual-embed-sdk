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


