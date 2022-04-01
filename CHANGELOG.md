# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Allow passing in a mermaid `configFile` as an object to `mermaid-cli`.

### Fixed

- Fix wide SVGs (e.g. gitgraphs) being cut at 300px.
  Automatically replaces SVG `width=100%` to the width in pixels.
  Most browsers will cut SVGs to 300px. (closes [#7](https://github.com/aloisklink/remark-mermaid-dataurl/issues/7))

## [1.0.2] - 2021-03-29

### Fixed

- Remove dependency on the temp directory, by using `memfs` instead
  [#6](https://github.com/aloisklink/remark-mermaid-dataurl/pull/6).
  This should improve usage on platforms such as Docker/Vercel.

## [1.0.1] - 2021-02-05

### Fixed

- Support versions of Node above 10 [#4](https://github.com/aloisklink/remark-mermaid-dataurl/pull/4)
