# remark-mermaid-dataurl

![npm](https://img.shields.io/npm/v/remark-mermaid-dataurl)
![NPM](https://img.shields.io/npm/l/remark-mermaid-dataurl)
![node-current](https://img.shields.io/node/v/remark-mermaid-dataurl)

A remark plugin for Markdown that replaces mermaid graphs with dataurls

Designed for use with Docusaurus v2.

## Example

````markdown
Here is my **example** mermaid diagram:

```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```
````

After running `remark-mermaid-dataurl`, the mermaid diagram within the ` ```mermaid `
code block will be rendered into an SVG file, then inserted into the markdown
code as a
[dataurl](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs)
(dataurl is truncated, as they are quite large):

````markdown
Here is my **example** mermaid diagram:

![Diagram generated via mermaid](data:image/svg+xml;charset=UTF-8,%3Csvg%20id%3D%22mermaid-1654...]
````

## Options

```js
const options = {
  mermaidCli: {
    // args to pass as `--arg value` to mermaidCli (run `npx mmdc --help` to view)
    // passing configFile or puppeteerConfigFile as an object will automatically be converted into a JSON
    configFile: {
      // see options at https://mermaid-js.github.io/mermaid/#/Setup
      theme: "forest",
    },
    puppeteerConfigFile: {
      // see options at https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#puppeteerlaunchoptions
      product: "firefox" // use firefox instead of chrome
      timeout: 60000, // change default puppeteer launch timeout
    },
  }
}
```

## Usage with Docusaurus

_see https://v2.docusaurus.io/docs/markdown-features#configuring-plugins for more info_

First, install this plugin:

```bash
npm install --save remark-mermaid-dataurl
```

Then, add them to your `@docusaurus/preset-classic` options in `docusaurus.config.js`:

```js
module.exports = {
  // ...
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          // ...
          remarkPlugins: [
            require("remark-mermaid-dataurl"),
            // options, // optional options here
          ],
        },
      },
    ],
  ],
};
```
