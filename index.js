require("core-js/features/object/entries");
require("core-js/features/array/flat-map");
const { Volume } = require("memfs");
const childProcess = require("child_process");
const path = require("path");

const visit = require("unist-util-visit");
const mmdc = require.resolve("@mermaid-js/mermaid-cli/index.bundle.js");

const { setSvgBbox } = require("./src/svg.js");

const PLUGIN_NAME = "remark-mermaid-dataurl";

const createVolume = () => {
  const volume = new Volume();
  volume.mkdirSync(process.cwd(), { recursive: true });
  return volume;
};

/**
 * Calls mmdc (mermaid-cli) with the given keyword args
 * @param {{[key: string]: any}} kwargs
 *   Args passed to mmdc in format `--key value`
 * @param {string} input input file contents
 * @returns {Promise<void, Error>}
 */
function renderMermaidFile(kwargs, input) {
  const volume = createVolume();
  const cwd = process.cwd();
  const outputPath = path.join(cwd, "output.svg");
  const inputPath = path.join(cwd, "input");
  volume.writeFileSync(inputPath, input, "utf8");

  if (kwargs.configFile && typeof kwargs.configFile === "object") {
    const configFilePath = path.join(cwd, "config.json");
    volume.writeFileSync(
      configFilePath,
      JSON.stringify(kwargs.configFile),
      "utf8"
    );
    kwargs = { ...kwargs, configFile: configFilePath };
  }

  const args = Object.entries({
    ...kwargs,
    input: inputPath,
    output: outputPath,
  }).flatMap(([key, value]) => [`--${key}`, value]);
  const child_process = childProcess.fork(
    require.resolve("./mermaid_hook"),
    args,
    {}
  );
  child_process.send(volume.toJSON());

  return new Promise((resolve, reject) => {
    let exited = false; // stream may error AND exit
    child_process.on("message", (volumeJSON) => {
      exited = true;
      child_process.kill();
      volume.fromJSON(volumeJSON);
      resolve(volume.promises.readFile(outputPath, { encoding: "utf8" }));
    });
    child_process.on("error", (error) => {
      exited = true;
      reject(error);
    });
    child_process.on("exit", (code, signal) => {
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
      } else if (signal) {
        reject(
          new Error(
            `${mmdc} with kwargs ${JSON.stringify(
              kwargs
            )} recieved signal ${signal}`
          )
        );
      } else {
        // Mermaid-CLI throws unhandledRejection warnings
        // which sometimes return exit code 0
        reject(
          new Error(
            `${mmdc} with kwargs ${JSON.stringify(
              kwargs
            )} exited without returning created SVG.`
          )
        );
      }
    });
  });
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
