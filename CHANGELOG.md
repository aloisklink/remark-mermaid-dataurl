# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Dependencies

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
