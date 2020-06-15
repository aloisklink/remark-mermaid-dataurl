# remark-mermaid-dataurl

A remark plugin for Markdown that replaces mermaid graphs with dataurls

Designed for use with Docusaurus v2.

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
          remarkPlugins: [require("remark-mermaid-dataurl")],
        },
      },
    ],
  ],
};
```
