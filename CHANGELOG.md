# Changelog

Please find the comprehensive list of changes for ThoughtSpot releases and SDK [here](https://developers.thoughtspot.com/docs/?pageid=whats-new)
This project follows Semantic Versioning.

## Unreleased

### New Features
- Events for all actions on Search Embed
## 1.10.0 (04-22-2022)

- Release to support TS version 8.2.0.cl
- Please check the full list of changes [here](https://developers.thoughtspot.com/docs/?pageid=whats-new)

## 1.9.5 (04-06-2022)

### New Features
- `locale` param to set Locale/language for the embedded view.


## 1.9.4 (04-06-2022)

### Fixed
- [React] `className` should be forwarded to the iframe container div.


## 1.9.3 (03-22-2022)

### New Features 
- `disableLoginRedirect` option in `EmbedConfig`

## 1.9.2 (03-17-2022)

### New Features 
- Ability to trigger events on React components
  - Added new `useEmbedRef` hook, check README for usage.

### Fixed

- Typings for `on*` event handlers for React components


## 1.9.1 (03-15-2022)

### New Features

- `visibleVizs` option in the `LiveboardEmbed`
- `LiveboardRendered` new `EmbedEvent` emitted when a liveboard completes rendering.


## 1.9.0

- Release to support TS version 8.1.0.cl
- Please check the full list of changes [here](https://developers.thoughtspot.com/docs/?pageid=whats-new)


## 1.8.1

### Bug fix

- `authEndpoint` in AuthServer authentication scheme was failing because of a missing `await`.

## 1.8.0

### Breaking Changes

-   `autoLogin` option in `init` method is now by default `false` instead of `true`.

### New Features

-   `init` method now returns the `authPromise` which resolves when auth is complete.

## 1.7.0 (and earlier)

-   Please check the full list of changes [here](https://developers.thoughtspot.com/docs/?pageid=whats-new)
