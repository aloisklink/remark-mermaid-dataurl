# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
  
  Our `dependencies` contain `"@mermaid-js/mermaid-cli":  ^8.9.2"`,
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
