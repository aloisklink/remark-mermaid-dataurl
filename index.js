const { readFile } = require("fs/promises");
const puppeteer = require("puppeteer");

const PLUGIN_NAME = "remark-mermaid-dataurl";

/**
 * @typedef {{[key: string]: any}} MermaidCliKwargs CLI options to pass to `@mermaid-js/mermaid-cli`
 *
 * For example, `--cssFile my-css-file.css` can be converted to `{"cssFile": "my-css-file.css"}`
 */

/**
 * Adds custom `remark-mermaid-dataurl` defaults to a mermaid config file.
 *
 * Sets `useMaxWidth` to `false` by default for better Markdown SVGs.
 *
 * @param {{[x: string]: any}} mermaidConfig - Warning, this is modified by this function.
 * @returns {object} The input object with some default vars modified.
 */
function addDefaultConfig(mermaidConfig) {
  const GRAPHS_TO_DISABLE_MAX_WIDTH = [
    "flowchart",
    "sequence",
    "gantt",
    "journey",
    "class",
    "state",
    "er",
    "pie",
    "requirement",
    "c4",
  ];
  for (const graphType of GRAPHS_TO_DISABLE_MAX_WIDTH) {
    mermaidConfig[graphType] = {
      // if this is true (default), SVG will use up the entire width of the markdown
      // document, which is much much too wide
      useMaxWidth: false,
      ...mermaidConfig[graphType],
    };
  }
  return mermaidConfig;
}

/**
 * Converts CLI args to {@link parseMMD} options.
 *
 * Required for backwards compatibility.
 *
 * @param {{[key: string]: any}} kwargs Args passed to mmdc in format `--key value`
 * @returns {Promise<import("@mermaid-js/mermaid-cli").ParseMDDOptions>} Options to pass to parseMMD.
 */
async function convertMermaidKwargsToParseMMDOpts({
  theme,
  width = 800,
  height = 600,
  backgroundColor,
  configFile,
  cssFile,
  scale,
  pdfFit,
}) {
  let mermaidConfig = { theme };
  if (configFile) {
    if (typeof configFile !== "object") {
      mermaidConfig = {
        ...mermaidConfig,
        ...JSON.parse(await readFile(configFile, { encoding: "utf8" })),
      };
    } else {
      mermaidConfig = { ...mermaidConfig, ...configFile };
    }
  }

  let myCSS;
  if (cssFile) {
    myCSS = await readFile(cssFile, { encoding: "utf8" });
  }

  return {
    mermaidConfig: addDefaultConfig(mermaidConfig),
    backgroundColor,
    myCSS,
    pdfFit,
    viewport: { width, height, deviceScaleFactor: scale },
  };
}

/**
 * Converts a string to a base64 string
 *
 * @param {string} string - The string to convert.
 */
function btoa(string) {
  return Buffer.from(string).toString("base64");
}

/**
 * Creates a data URL.
 *
 * @param {string} data - The data to convert.
 * @param {string} mimeType - The MIME-type of the data.
 * @param {boolean} [base64] - If `true`, use base64 encoding instead of URI encoding.
 * (Better for encoding binary data).
 * @returns {string} The dataurl.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
 */
function dataUrl(data, mimeType, base64 = false) {
  if (base64) {
    return `data:${mimeType};base64,${btoa(data)}`;
  } else {
    return `data:${mimeType},${encodeURIComponent(data)}`;
  }
}

/**
 * Transforms the given Mermaid Node.
 *
 * @param {import("mdast").Code} node - The Mermaid code-block.
 * @param {import("vfile").VFile} file - The VFile to report errors to.
 * @param {number} index - Index of node in `parent` node.
 * @param {import("mdast").Parent} parent - The parent node.
 * @param {object} options - Options.
 * @param {MermaidCliKwargs} options.mermaidCli - kwargs to pass to mermaid cli.
 * @param {puppeteer.Browser} options.browser - Puppeteer browser to use.
 */
async function transformMermaidNode(
  node,
  file,
  index,
  parent,
  { mermaidCli, browser },
) {
  const { lang, value, position } = node;
  try {
    const { renderMermaid } = await import("@mermaid-js/mermaid-cli");
    const { setSvgBbox, validSVG } = await import("./src/svg.mjs");
    const { title, desc, data } = await renderMermaid(
      browser,
      value,
      "svg",
      await convertMermaidKwargsToParseMMDOpts(mermaidCli),
    );

    let svgString = new TextDecoder().decode(data);

    // attempts to convert the whatever mermaid-cli returned into a valid SVG
    // or throws an error if it can't
    svgString = validSVG(svgString);
    // replace width=100% with actual width in px
    svgString = setSvgBbox(svgString);

    /** @type {import("mdast").Image} */
    const newNode = {
      type: "image",
      title: title ?? "Diagram generated via mermaid",
      url: dataUrl(svgString, "image/svg+xml;charset=UTF-8"),
      alt: desc ?? "Diagram generated via mermaid",
    };

    file.info(`${lang} code block replaced with graph`, position, PLUGIN_NAME);
    // replace old node with current node
    parent.children[index] = newNode;
  } catch (error) {
    const errorError = error instanceof Error ? error : new Error(`${error}`);
    file.fail(errorError, position, PLUGIN_NAME);
  }
}

/**
 * Remark plugin that converts mermaid codeblocks into self-contained SVG dataurls.
 * @param {Object} options
 * @param {Object} [options.mermaidCli] Options to pass to mermaid-cli
 * @param {Object | string} [options.mermaidCli.configFile] - If set, a path to
 * a JSON configuration file for mermaid.
 * If this is an object, it will be automatically converted to a JSON config
 * file and passed to mermaid-cli.
 * @param {import("puppeteer").LaunchOptions | string} [options.mermaidCli.puppeteerConfigFile] - If set,
 * a path to a JSON configuration file for mermaid CLI's puppeteer instance.
 * If this is an object, it will be automatically converted to a JSON config
 * file and passed to mermaid-cli.
 */
function remarkMermaid({ mermaidCli = {} } = {}) {
  const options = { mermaidCli };
  /**
   * Look for all code nodes that have the language mermaid,
   * and replace them with images with data urls.
   *
   * @param {import("mdast").Root} tree The Markdown Tree
   * @param {import("vfile").VFile} file The virtual file.
   * @returns {Promise<void>}
   */
  return async function (tree, file) {
    /** @type {Array<Promise<void>>} */
    const promises = []; // keep track of promises since visit isn't async

    const { visit } = await import("unist-util-visit");
    let puppeteerConfigFile = mermaidCli.puppeteerConfigFile ?? {};
    if (typeof puppeteerConfigFile === "string") {
      puppeteerConfigFile = /** @type {import("puppeteer").LaunchOptions} */ (
        JSON.parse(await readFile(puppeteerConfigFile, { encoding: "utf8" }))
      );
    }

    const browser = await puppeteer.launch(puppeteerConfigFile);
    try {
      // @ts-ignore There's some issue with TypeScript here
      visit(tree, (node, index, parent) => {
        // If this codeblock is not mermaid, bail.
        if (node.type !== "code" || node.lang !== "mermaid") {
          return node;
        }
        promises.push(
          transformMermaidNode(
            node,
            file,
            // We know these values are never `null`, since a Code block will
            // never be the Root of a mdast, so there will always be a Parent
            /** @type {number} */ (index),
            /** @type {import("mdast").Parent} */ (parent),
            {
              ...options,
              browser,
            },
          ),
        );
      });
      await Promise.all(promises);
    } finally {
      await browser.close();
    }
  };
}

module.exports = remarkMermaid;
