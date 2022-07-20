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

/**
 * Renders a markdown file through `remark-markdown-dataurl`.
 *
 * This is a markdown -> markdown conversion.
 *
 * @param {string} inputFileName - Path to input markdown file.
 * @param {string} outputFileName - Path to output markdown file.
 * @param {Parameters<remarkMermaidDataurl>[0]} remarkOptions - Options for
 * `remark-data-url`.
 */
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
 * @param {Parameters<remarkMermaidDataurl>[0]} [opts.remarkOptions] - Options to pass
 * to `remark-mermaid-dataurl`.
 * @param {array} [opts.css] - Array of CSS options. E.g. `['img.svg { width: 100%; height: auto; }']`
 */
async function testScreenshotSnapshot(
  inputFileName,
  { remarkOptions = {}, css = [] } = {}
) {
  const infile = fs.promises.readFile(inputFileName, {
    encoding: "utf8",
  });

  const htmlFile = (
    await remark()
      .use(remarkMermaidDataurl, remarkOptions)
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
    comparisonMethod: "ssim",
    failureThreshold: 0.02,
    failureThresholdType: "percent",
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

  test("should render git graphs correctly", async () => {
    await renderWithRemark(
      "test/fixtures/gitgraph.in.md",
      "test/fixtures/gitgraph.out.md"
    );
  });

  test("should render git graphs visually", async () => {
    await testScreenshotSnapshot("test/fixtures/gitgraph.in.md");
  });

  test("should render flowcharts visually", async () => {
    await testScreenshotSnapshot("test/fixtures/flowchart.in.md");
  });

  test("should render flowcharts correctly", async () => {
    await renderWithRemark(
      "test/fixtures/flowchart.in.md",
      "test/fixtures/flowchart.out.md"
    );
  });

  test("should fail to render invalid mermaid visually", async () => {
    await expect(
      testScreenshotSnapshot("test/fixtures/invalid.in.md")
    ).rejects.toThrow("Parse error");
  });

  test("should use puppeteer config", async () => {
    await expect(
      renderWithRemark(
        "test/fixtures/gitgraph.in.md",
        "test/fixtures/should-never-happen.out.md",
        {
          mermaidCli: {
            puppeteerConfigFile: {
              timeout: 1, // should fail
            },
          },
        }
      )
    ).rejects.toThrow("TimeoutError");
  });

  test("should use mermaid-cli to use forest theme", async () => {
    await testScreenshotSnapshot("test/fixtures/basic.in.md", {
      remarkOptions: {
        mermaidCli: {
          configFile: {
            theme: "forest",
          },
        },
      },
    });
  });
});
