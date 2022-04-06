const fs = require("fs");
const remark = require("remark");
const remark2rehype = require("remark-rehype");
const doc = require("rehype-document");
const html = require("rehype-stringify");

const puppeteer = require("puppeteer");
const { toMatchImageSnapshot } = require("jest-image-snapshot");

const remarkMermaidDataurl = require("../index.js");

expect.extend({ toMatchImageSnapshot });
jest.setTimeout(30000); // 30 seconds since mermaid-cli is slow

async function renderWithRemark(
  inputFileName,
  outputFileName,
  remarkOptions = {}
) {
  const infile = fs.promises.readFile(inputFileName, {
    encoding: "utf8",
  });

  const file = await remark()
    .use(remarkMermaidDataurl, remarkOptions)
    .process(await infile);
  const outfile = file.contents;
  await fs.promises.writeFile(outputFileName, outfile, {
    encoding: "utf8",
  });
}

/**
 * Runs remark-markdown-dataurl on a markdown file and captures
 * and image of the generated HTML.
 *
 * @param {string} inputFileName - Filename to markdown file to render.
 * @param {object} [opts] - Optional options.
 * @param {array} [css] - Array of CSS options. E.g. `['img.svg { width: 100%; height: auto; }']`
 */
async function testScreenshotSnapshot(inputFileName, { css = [] } = {}) {
  const infile = fs.promises.readFile(inputFileName, {
    encoding: "utf8",
  });

  const htmlFile = (
    await remark()
      .use(remarkMermaidDataurl)
      .use(remark2rehype)
      .use(doc, { style: css })
      .use(html)
      .process(await infile)
  ).contents;
  const browser = await puppeteer.launch({});
  const page = await browser.newPage();
  page.setViewport({ width: 1000, height: 800, deviceScaleFactor: 1 });
  await page.setContent(htmlFile);
  const screenshot = await page.screenshot();
  await browser.close();
  expect(screenshot).toMatchImageSnapshot({
    // only enable inline diff for GitHub Actions or CI
    // if it's on a local PC, we can just open up the file
    dumpInlineDiffToConsole: process.env["CI"],
    failureThreshold: 0.1,
    failureThresholdType: "percent",
    blur: 2,
  });
}

describe("test markdown files", () => {
  test("should render basic.md without errors", async () => {
    await renderWithRemark(
      "test/fixtures/basic.in.md",
      "test/fixtures/basic.out.md"
    );
  });

  test("should render basic.md visually", async () => {
    await testScreenshotSnapshot("test/fixtures/basic.in.md");
  });
});
