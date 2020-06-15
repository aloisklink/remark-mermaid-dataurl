const fs = require("fs");
const childProcess = require("child_process");
const os = require("os");
const path = require("path");

const visit = require("unist-util-visit");
const mmdc = require.resolve("@mermaid-js/mermaid-cli/index.bundle.js");

const PLUGIN_NAME = "remark-mermaid-dataurl";

/**
 * Deletes a folder, (essentially does `rmdir(tmpdir, {recursive: true})`)
 *
 * We can't use rmdir(p, {recursive: true}) since it isn't fully supported
 * in Node.Js yet.
 * @param {string} tmpdir The directory to delete
 */
async function cleanup(tmpdir) {
  const files = await fs.promises.readdir(tmpdir);
  await Promise.all(
    files.map((file) => {
      return fs.promises.unlink(path.join(tmpdir, file));
    })
  );
  await fs.promises.rmdir(tmpdir);
}

/**
 * Calls mmdc (mermaid-cli) with the given keyword args
 * @param {{[key: string]: any}} kwargs
 *   Args passed to mmdc in format `--key value`
 * @returns {Promise<void, Error>}
 */
async function renderMermaidFile(kwargs) {
  const argPairs = Object.keys(kwargs).map((key) => [`--${key}`, kwargs[key]]);
  const args = [].concat(...argPairs); // flatten
  const process = childProcess.fork(mmdc, args, { silent: true });

  return new Promise((resolve, reject) => {
    let exited = false; // stream may error AND exit
    process.on("error", (error) => {
      exited = true;
      reject(error);
    });
    process.on("exit", (code, signal) => {
      if (exited) {
        return; // already resolved Promise
      }
      if (code) {
        reject(
          new Error(
            `${mmdc} with kwargs ${JSON.stringify(
              kwargs
            )} failed with error code: ${code}`
          )
        );
      }
      if (signal) {
        reject(
          new Error(
            `${mmdc} with kwargs ${JSON.stringify(
              kwargs
            )} recieved signal ${signal}`
          )
        );
      }
      resolve();
    });
  });
}

/**
 * Creates an SVG from the given mermaid input text.
 * @param {string} inputText The mermaid text to render.
 * @param {Object} mermaidCliOptions Options to pass to mermaid-cli
 * @returns {Promise<string>} The contents of the rendered SVG file.
 */
async function renderMermaidText(inputText, mermaidCliOptions) {
  const tmpdir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "remark-mermaid-")
  );
  const inputPath = path.join(tmpdir, "input");
  const outputPath = path.join(tmpdir, "output.svg");
  try {
    await fs.promises.writeFile(inputPath, inputText, { encoding: "utf8" });
    await renderMermaidFile({
      ...mermaidCliOptions,
      input: inputPath,
      output: outputPath,
    });
    return await fs.promises.readFile(outputPath, { encoding: "utf8" });
  } finally {
    await cleanup(tmpdir);
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
    const data = await renderMermaidText(value, mermaidCli);
    const newNode = {
      type: "image",
      title: "Diagram generated via mermaid",
      url: dataUrl(data, "image/svg+xml;charset=UTF-8"),
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
 * @param {Obejct} options.mermaidCli Options to pass to mermaid-cli
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
