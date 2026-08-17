# Visual Embed SDK

Public, published npm package (`@thoughtspot/visual-embed-sdk`) consumed by
external customers. The doc comments in `src/` are published to
developers.thoughtspot.com, so they ship just like the code does — treat a wrong
doc comment as a defect, not a nit.

## Layout

- `src/embed/**` — the embed classes
- `src/react/**` — React wrapper
- `src/utils/**` — shared helpers
- `src/types.ts` — public types and enums
- `src/auth.ts`, `src/authToken.ts`, `src/embed/base.ts` — auth, postMessage,
  iframe and host-event handling. Check origin validation and token handling
  here, and never log anything secret.
- `src/**/*.spec.ts` — tests
- `typedoc-theme/**` — hand-written `.hbs` templates that render the docs site.
  Watch for XSS: triple-brace `{{{ ... }}}` interpolation of anything derived
  from source comments, and `innerHTML` in `assets/js/main.js`.

Generated — never hand-edit: `static/typedoc/typedoc.json` (`npm run docgen`) and
`package-lock.json`. The bump-version workflow commits exactly those two plus
`package.json`.

`CHANGELOG.md` is **hand-maintained** — no workflow writes it, and it has drifted
far behind `package.json`. It is excluded from review by choice, not because a
tool owns it. The authoritative release notes live at
developers.thoughtspot.com/docs/?pageid=whats-new.

## Public API surface

Anything exported is public, especially in `src/types.ts`. A rename, a narrowed
type, a removed enum member or a changed default is a **breaking change** for
customers already on a minor version.

Never change an enum's string value (`'ThoughtspotAuthExpired'`) — ThoughtSpot
compares against it, so editing one breaks the API even when it looks like a typo.

## Doc comments

`.gemini/styleguide.md` holds the 13 canonical documentation rules. **That file is
frozen — do not edit it.** It is stale and self-contradictory in the specific
places corrected below; where they disagree, the corrections here win.

Its header says its scope is "strictly" text inside `/** ... */` blocks. Read that
as a minimum, not a ceiling — its own IN SCOPE list already includes user-facing
log/error strings. The spelling, abbreviation, brand-casing, grammar and en-US
rules (4, 5, 6, 9) apply equally to:

- doc comments
- authored prose — `README.md`, `Contributing.md`
- user-facing strings in `console.log` / `console.warn` / `new Error(...)`

The brand is **ThoughtSpot** (capital T, capital S) in prose. Never "fix" casing
inside URLs, emails, package names, code identifiers or enum values.

### Version tags

Format: `@version SDK: X.Y.Z | ThoughtSpot Cloud: A.B.C.cl` — a space on both
sides of the pipe, no colon after `@version` itself.

SDK minor and ThoughtSpot Cloud minor advance **in lockstep**. For SDK `1.N.x`
the Cloud version is `26.(N-43).0.cl`:

| SDK | ThoughtSpot Cloud |
|---|---|
| 1.48 | 26.5.0.cl |
| 1.49 | 26.6.0.cl |
| 1.50 | 26.7.0.cl |
| 1.51 | 26.8.0.cl |
| 1.52 | 26.9.0.cl |

**Use the formula, not the table in styleguide.md rule 11** — that table is frozen
at 1.50 and `src/` has moved past it. Extending the sequence is correct; treating
1.50 as the ceiling is not.

`| ThoughtSpot:` without "Cloud" is legacy. It is fine where it already exists;
use the full form in new tags.

### Boolean params — prefer `undefined` over `= false`

ThoughtSpot treats an omitted param as falsy, and sending `false` for every unset
flag bloats the URL. So don't default flags to `false` when destructuring; leave
them `undefined` and only add the param when the caller set it:

```ts
// no default — stays undefined when the caller does not set it
enableHomepageAnnouncement,
// ...
if (enableHomepageAnnouncement !== undefined) {
    params[Param.EnableHomepageAnnouncement] = enableHomepageAnnouncement;
}
```

### Deprecated terminology

In **new or edited** doc text: Pinboard/Dashboard → Liveboard, Worksheet →
Model/LogicalModel, SpotIQ → Cortex/Analysis.

The repo already contains ~108 "Pinboard", ~45 "SpotIQ" and ~15 "Worksheet".
Leave untouched lines alone. Never rename class names, enum values, file names or
import paths — `PinboardEmbed` and `EmbedEvent.Pinboard` are load-bearing public
API, not typos.

## What the linter does and does not cover

eslint + prettier handle runtime-code formatting — indentation, semicolons, quote
style, line length — in statements outside comment blocks. Don't hand-fix those.
`comment-length` caps comment lines at 90 chars.

Nothing checks the inside of a comment block: `eslint-plugin-jsdoc` is in
`devDependencies` but is never registered in `eslint.config.mjs` (the lone
`jsdoc/check-tag-names: 0` entry there is dead config), and prettier does not
reformat comment interiors. So tag order, tag casing, `@version` format, example
validity, and `*` alignment within an example are unchecked by tooling — they only
get caught by review.

## Build and CI

- `dist/tsembed.es.js` has a **34 kB** size limit (`npm run check-size`). Add to
  `dependencies` only what is genuinely needed at runtime; everything else is a
  `devDependency`.
- Type-checking, unit tests and the size check all run in CI.
- Tests should pin behavior — an assertion that would fail if the change were
  reverted.
