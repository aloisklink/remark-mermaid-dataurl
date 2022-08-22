const { readFile } = require("fs/promises");
const puppeteer = require("puppeteer");

const visit = require("unist-util-visit");

const { setSvgBbox, validSVG } = require("./src/svg.js");

const PLUGIN_NAME = "remark-mermaid-dataurl";

/**
 * Calls mmdc (mermaid-cli) with the given keyword args.
 *
 * This function runs `mmdc` in a separate process.
 * Additionally, the separate process has a custom hook function to automatically
 * save/load the mmd input text and SVG output text in a virtual NodeJS `memfs`,
 * so that we don't need access to the file system.
 *
 * @param {{[key: string]: any}} kwargs
 *   Args passed to mmdc in format `--key value`
 * @param {string} input mermaid input file contents
 * @throws {Error} If mmdc fails in anyways.
 * @returns {Promise<string>} Returns the rendered mermaid code as an SVG.
 */
async function renderMermaidFile(kwargs, input) {
  let configFile = kwargs.configFile ?? {};
  if (kwargs.configFile && typeof kwargs.configFile !== "object") {
    configFile = JSON.parse(
      await readFile(kwargs.configFile, { encoding: "utf8" })
    );
  }
  let puppeteerConfigFile = kwargs.puppeteerConfigFile ?? {};
  if (
    kwargs.puppeteerConfigFile &&
    typeof kwargs.puppeteerConfigFile !== "object"
  ) {
    puppeteerConfigFile = JSON.parse(
      await readFile(kwargs.puppeteerConfigFile, { encoding: "utf8" })
    );
  }

  // eslint-disable-next-line node/no-unsupported-features/es-syntax, node/no-missing-import
  const { parseMMD } = await import("@mermaid-js/mermaid-cli");
  const browser = await puppeteer.launch(puppeteerConfigFile);
  try {
    const outputSvg = await parseMMD(browser, input, "svg", {
      mermaidConfig: configFile,
      viewport: { width: 800, height: 600 },
    });
    return outputSvg.toString("utf8");
  } finally {
    await browser.close();
  }
}

/** Converts a string to a base64 string */
function btoa(string) {
  return Buffer.from(string).toString("base64");
}

function dataUrl(data, mimeType, base64 = false) {
  if (base64) {
    return `data:${mimeType};base64,${btoa(data)}`;
  } else {
    return `data:${mimeType},${encodeURIComponent(data)}`;
  }
}

async function transformMermaidNode(node, file, index, parent, { mermaidCli }) {
  const { lang, value, position } = node;
  try {
    let svgString = await renderMermaidFile(mermaidCli, value);

    // attempts to convert the whatever mermaid-cli returned into a valid SVG
    // or throws an error if it can't
    svgString = validSVG(svgString);
    // replace width=100% with actual width in px
    svgString = setSvgBbox(svgString);

    const newNode = {
      type: "image",
      title: "Diagram generated via mermaid",
      url: dataUrl(svgString, "image/svg+xml;charset=UTF-8"),
      alt: "Diagram generated via mermaid",
    };

    file.info(`${lang} code block replaced with graph`, position, PLUGIN_NAME);
    // replace old node with current node
    parent.children[index] = newNode;
  } catch (error) {
    file.fail(error, position, PLUGIN_NAME);
  }
}

/**
 * Remark plugin that converts mermaid codeblocks into self-contained SVG dataurls.
 * @param {Object} options
 * @param {Object} options.mermaidCli Options to pass to mermaid-cli
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
   * @param {Node} tree The Markdown Tree
   * @param {VFile} file The virtual file.
   * @returns {Promise<void>}
   */
  return async function (tree, file) {
    const promises = []; // keep track of promises since visit isn't async
    visit(tree, "code", (node, index, parent) => {
      // If this codeblock is not mermaid, bail.
      if (node.lang !== "mermaid") {
        return node;
      }
      promises.push(transformMermaidNode(node, file, index, parent, options));
    });
    await Promise.all(promises);
  };
}

module.exports = remarkMermaid;
