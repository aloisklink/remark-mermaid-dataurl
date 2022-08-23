/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  // An array of file extensions your modules use
  testMatch: [
    // look for test.mjs files
    "**/?(*.)+(spec|test).?([cm])[tj]s?(x)",
  ],
  // work around for https://github.com/nodejs/node/issues/35889#issuecomment-1129293091
  runner: "jest-light-runner",
};
