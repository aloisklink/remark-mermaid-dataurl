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

process.on("message", (volumeJSON) => {
  const virtualVolume = Volume.fromJSON(volumeJSON);
  virtualVolume.mkdirSync(process.cwd(), { recursive: true });
  const existsSync = fs.existsSync.bind(fs);
  const readFile = fs.readFile.bind(fs);
  patch_fs(
    fs,
    {
      writeFileSync: (...args) => {
        virtualVolume.writeFileSync(...args);
        process.send(virtualVolume.toJSON());
      },
      writeFile: callbackify((...args) => {
        virtualVolume.writeFileSync(...args.slice(0, -1));
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
    },
    ["writeFileSync", "existsSync", "readFile", "writeFile"]
  );

  require(mermaid_cli);
});
