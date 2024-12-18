# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.1] - 2024-11-02

### Fixed

- Support svgdom 0.1.17 or later.

## [3.0.0] - 2024-10-13

### BREAKING CHANGES

- Bump required Node.JS version to 18.19
- Updated `@mermaid-js/mermaid-cli` to `^11`

### Dependencies

- Updated `puppeteer` to `^23`
- Updated `unist-util-visit` to `^5`
- Updated `vfile` to `^6`

## [2.1.1] - 2023-05-11

### Fixed

- Fix missing `"types"` field in `package.json`. Types should now be correctly
  exported.

## [2.1.0] - 2023-05-10

### Added

- Add TypeScript types to `remark-mermaid-dataurl`
- Use Mermaid titles/descriptions for the output markdown image's
  title/alt-text, e.g. like:

  ```markdown
  ![Mermaid diagram description](data:image/svg+xml;charset=UTF-8,%3Csvg%20id%3D%22mermaid-1654... "Mermaid diagram title")
  ```

  See https://mermaid.js.org/config/accessibility.html for how to add titles
  and descriptions to your Mermaid diagrams.

### Dependencies

- Add `@types/mdast` and `vfile` as dependencies. We only use these for their
  types.
- Updated `@mermaid-js/mermaid-cli` from `^10.0.0` to `^10.0.2` to use the types
  added by that release.

## [2.0.7] - 2023-03-05

### Fixed

- Fix minimum support Node versions to `^14.13 || >=16.0`.
  This was always the case, due to a transitive dependency
  via `mermaid-cli` on `chalk`.
  See [mermaid-js/mermaid-cli@`57781f7`](https://github.com/mermaid-js/mermaid-cli/commit/57781f707a3665121c6cbc1f96fd202c1980db4a).

### Dependencies

- Updated `@mermaid-js/mermaid-cli` from `^9.1.6` to `^10.0.0`,
  see [mermaid-js/mermaid-cli@10.0.0 release notes](https://github.com/mermaid-js/mermaid-cli/releases/tag/10.0.0)
  and [mermaid@10.0.0 release notes](https://github.com/mermaid-js/mermaid/releases/tag/v10.0.0).

  It looks like the main breaking changes are to do with Mermaid's API,
  but there are no breaking changes to `mermaid-cli`, or this package.

## [2.0.6] - 2022-11-13

### Fixed

- Fix undefined SVG `svgjs` namespace error
  Sometimes, the generated SVGs are invalid due to an unknown `svgjs`
  prefix error (this happens with `mermaid-mindmaps`),
  see https://github.com/svgdotjs/svg.js/issues/1285.

  This work-around manually defines the XML `svgjs` namespace by
  adding `xmlns:svgjs` to the `<svg ...>` element until the upstream
  issue/bug is fixed.

### Dependencies

- Updated puppeteer from `^18.0.4` to `^19.0.0`

## [2.0.5] - 2022-10-09

### Fixed

- Set mermaid config option
  [`useMaxWidth`](https://mermaid-js.github.io/mermaid/#/Setup?id=usemaxwidth-1)
  to `false` by default.
  In Mermaid v9.1.7, some graph types default to using all the available
  horizontal space.
  On many markdown renderers, this creates very large diagrams,
  so by default `remark-mermaid-dataurl` limits them to use a smaller amount of space
  (e.g. pre-v9.1.7 behaviour).
- Fix passing `configFile` as a JS object.

## [2.0.4] - 2022-09-29

### Performance

- Share a single puppeteer browser instance for all mermaid images.
  [`9bccb09`](https://github.com/aloisklink/remark-mermaid-dataurl/commit/9bccb0911874a66c5911da107148ff000891e34e)

### Dependencies

- Updated puppeteer from `^16.0.0` to `^18.0.4`

## [2.0.3] - 2022-08-25

### Fixed

- Fixed some `mermaidCli` options being ignored in v2.0.2

### Dependencies

- Updated `unist-util-visit` from `^2.0.3` to `^4.0.0`

## [2.0.2] - 2022-08-23

### Fixed

- Fixed support for mermaid-cli `^9.1.6`

### Dependencies

- Updated `mermaid-cli` version to `^9.1.6`
  - This increases the minimum version of `mermaid` to `^9.1.6`, see
    https://github.com/mermaid-js/mermaid/releases/tag/9.1.6
- Removed unneeded dependency on `memfs`
- Added dependency on puppeteer `^16.0.0`
  - puppeteer was previously a transitive dependency from `mermaid-cli`

## [2.0.1] - 2022-07-21

### Fixed

- Fixed error handling for mermaid-cli `^9.1.4`.

### Dependencies

- Updated `mermaid-cli` version to `^9.1.4`
  - This increases the minimum version of `mermaid` to `^9.1.3`, see
    https://github.com/mermaid-js/mermaid/releases/tag/9.1.3

## [2.0.0] - 2022-06-29

### Breaking Changes

- NodeJS 14.1 is the minimum supported version
- The minimum version of `mermaid-cli` has been bumped to `^9.1.2`.
  This has caused the following **BREAKING CHANGES**:
  - `mermaid` is now version `^9.0.0`
    - [Full CHANGELOG](https://github.com/mermaid-js/mermaid/releases/tag/9.0.0)
    - **BREAKING CHANGE**: `gitGraph`'s have been reinvented
      - The main branch is now called `main`, not `master`.
      - Plus numerous other `gitgraph changes, please see mermaid release notes.
  - `puppeteer` is now version `^14.1.0`
    - **BREAKING CHANGE**: NodeJS 14 is the minimum supported version now.

### Dependencies

- Updated `mermaid-cli` version to `^9.1.2`

## [1.1.1] - 2022-06-16

### Fixed

- Tries to automatically fix invalid SVGs returned by `mermaid-cli`.
  Somtimes `mermaid-cli` returns an SVG wrapped in a `<div>`, which caused a
  confusing error to occur.
- Allow `@mermaid-js/mermaid-cli` version to be `^8.10.1`
  (fixes `[#20](https://github.com/aloisklink/remark-mermaid-dataurl/issues/20))

  In `v1.10`, we limited `@mermaid-js/mermaid-cli` to be <=8.10.1, as 8.10.2 officially
  dropped Node v10 support.
  However, this causes breaking changes for people using mermaid 8.10.2+ features.

## Deprecated

- **Node v10 support is officially dropped in mermaid-cli 8.10.2**,
  but unofficially, it stills seems to work.

  Our `dependencies` contain `"@mermaid-js/mermaid-cli": ^8.9.2"`,
  however v8.10.2 of mermaid-cli updated to
  [puppeteer v10.0.0](https://github.com/mermaid-js/mermaid-cli/pull/128),
  which officially dropped Node v10 support. However, it still seems to work
  with Node v10, it's just unsupported.

  If you encounter issues while running on Node v10, please pin
  `remark-mermaid-dataurl` to `1.1.0`.

## [1.1.0] - 2022-06-09

### Added

- Allow passing in a mermaid `configFile` as an object to `mermaid-cli`.
- Allow passing in a puppeteer `puppeteerConfigFile` as an object to `mermaid-cli`.
  This allows increasing puppeteer's timeout, or using `firefox` instead of `chrome`.

### Fixed

- Fix wide SVGs (e.g. gitgraphs) being cut at 300px.
  Automatically replaces SVG `width=100%` to the width in pixels.
  Most browsers will cut SVGs to 300px. (closes [#7](https://github.com/aloisklink/remark-mermaid-dataurl/issues/7))
- An error is now thrown if mermaid-cli fails to render an SVG.
  Previously, the `Promise` returned by `renderMermaidFile` would stall forever
  if `mermaid-cli` exited without an error code, and without rendering an SVG.

### Dependencies

- Updated `husky` to v6.0.0 (v7.0.0 held back due to Node v10 support)
- Limit `mermaid-cli` version to `<=8.10.1`.
  This is because [mermaid-cli 8.10.2](https://github.com/mermaid-js/mermaid-cli/releases/tag/8.10.2)
  upgrades to [puppeteer v10.0.0](https://github.com/mermaid-js/mermaid-cli/pull/128),
  which drops Node v10 support.

## [1.0.2] - 2021-03-29

### Fixed

- Remove dependency on the temp directory, by using `memfs` instead
  [#6](https://github.com/aloisklink/remark-mermaid-dataurl/pull/6).
  This should improve usage on platforms such as Docker/Vercel.

## [1.0.1] - 2021-02-05

### Fixed

- Support versions of Node above 10 [#4](https://github.com/aloisklink/remark-mermaid-dataurl/pull/4)
