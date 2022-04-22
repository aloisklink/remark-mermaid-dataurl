const { Volume } = require("memfs");
const fs = require("fs");
const { callbackify } = require("util");

const mermaid_cli = require.resolve("@mermaid-js/mermaid-cli/index.bundle.js");

const patch_fs = (fs, volume, methods = []) => {
  const bkup = {};
  methods.forEach((method) => {
    bkup[method] = fs[method];
    fs[method] = volume[method].bind(volume);
  });
  return () => {
    Object.keys(bkup).forEach((method) => {
      fs[method] = bkup[method];
    });
  };
};

process.once("message", function (volumeJSON) {
  const virtualVolume = Volume.fromJSON(volumeJSON);
  virtualVolume.mkdirSync(process.cwd(), { recursive: true });

  // bind these functions to the original unpatched fs
  const existsSync = fs.existsSync.bind(fs);
  const readFile = fs.readFile.bind(fs);
  const readFileSync = fs.readFileSync.bind(fs);

  patch_fs(
    fs,
    {
      writeFileSync: (...args) => {
        virtualVolume.writeFileSync(...args);
        process.send(virtualVolume.toJSON());
      },
      writeFile: callbackify((...args) => {
        virtualVolume.writeFileSync(...args);
        process.send(virtualVolume.toJSON());
        return Promise.resolve();
      }),
      existsSync: (path) => {
        return existsSync(path) || virtualVolume.existsSync(path);
      },
      readFile: (path, opts, cb) => {
        if (virtualVolume.existsSync(path)) {
          return virtualVolume.readFile(path, opts, cb);
        }
        readFile(path, opts, cb);
      },
      readFileSync: (path, opts) => {
        if (virtualVolume.existsSync(path)) {
          return virtualVolume.readFileSync(path, opts);
        }
        return readFileSync(path, opts);
      },
    },
    ["writeFileSync", "existsSync", "readFile", "writeFile", "readFileSync"]
  );

  process.on("unhandledRejection", (reason, promise) => {
    console.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
    // mermaid_cli doesn't automatically throw error exit code on unhandled rejection errors
    process.send({ error: `${reason}` });
    process.exitCode = 1;
  });

  require(mermaid_cli);
});
