# Changelog

Please find the comprehensive list of changes for ThoughtSpot releases and SDK [here](https://developers.thoughtspot.com/docs/?pageid=whats-new)

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
