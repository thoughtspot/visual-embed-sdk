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

#### `@version` when you don't know the SDK version yet

You can't know which SDK version your PR will ship in — the next published version is only decided
when the release bump runs. Don't guess. Write `<TBD>` for the SDK half, and the real ThoughtSpot
release you are building against for the other:

```js
/**
 * @version SDK: <TBD> | ThoughtSpot Cloud: 26.10.0.cl
 */
```

**Only the SDK version may be `<TBD>`.** The ThoughtSpot release is not derivable from this repo,
so no automation can fill it in — you have to state it. Use `*` if the member isn't gated on a
cluster version. A `<TBD>` after the `|`, or an annotation with no ThoughtSpot release at all,
fails the `validate-version-tags` PR check.

The `bump-version-and-pr` workflow then replaces every `<TBD>` with the version being released,
before it regenerates the typedoc JSON the docs site is built from, and commits the result as part
of the `chore: release` PR. A version that is already filled in is never overwritten.

SDK minor and ThoughtSpot Cloud minor advance in lockstep — SDK `1.N.x` ships with
`26.(N-43).0.cl` — so the release step also warns if the Cloud version you wrote doesn't match the
SDK version being cut. It's a warning, not a failure: back-dating to an earlier release is
sometimes correct.

Locally: `npm run lint-versions` runs the PR check, `npm run resolve-versions` does the release
rewrite (add `--dry-run` to preview), and `npm run check-versions` fails if any `<TBD>` is left.
That last one also runs on `prepublishOnly`, so a release can never be published with an
unresolved placeholder in its public docs.


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


