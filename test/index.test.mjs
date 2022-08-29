import fs from "fs";
import { remark } from "remark";
import remark2rehype from "remark-rehype";
import doc from "rehype-document";
import html from "rehype-stringify";

import { launch } from "puppeteer";
import { toMatchImageSnapshot } from "jest-image-snapshot";

import remarkMermaidDataurl from "../index.js";

// wish-list, not supported in jest-light-runner
// see https://github.com/nicolo-ribaudo/jest-light-runner/issues/42
// import { jest, expect, describe, test } from "@jest/globals";

expect.extend({ toMatchImageSnapshot });

const timeout = 30000; // 30 seconds since mermaid-cli is slow

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
  const outfile = file.value;
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
  ).value;
  const browser = await launch({});
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
  test(
    "should render basic.md without errors",
    async () => {
      await renderWithRemark(
        "test/fixtures/basic.in.md",
        "test/fixtures/basic.out.md"
      );
    },
    timeout
  );

  test(
    "should render basic.md visually",
    async () => {
      await testScreenshotSnapshot("test/fixtures/basic.in.md");
    },
    timeout
  );

  test(
    "should render git graphs correctly",
    async () => {
      await renderWithRemark(
        "test/fixtures/gitgraph.in.md",
        "test/fixtures/gitgraph.out.md"
      );
    },
    timeout
  );

  test(
    "should render git graphs visually",
    async () => {
      await testScreenshotSnapshot("test/fixtures/gitgraph.in.md");
    },
    timeout
  );

  test(
    "should render flowcharts visually",
    async () => {
      await testScreenshotSnapshot("test/fixtures/flowchart.in.md");
    },
    timeout
  );

  test(
    "should render flowcharts correctly",
    async () => {
      await renderWithRemark(
        "test/fixtures/flowchart.in.md",
        "test/fixtures/flowchart.out.md"
      );
    },
    timeout
  );

  test(
    "should render multiple mermaid diagrams visually",
    async () => {
      await testScreenshotSnapshot("test/fixtures/multiple.in.md");
    },
    timeout
  );

  test(
    "should fail to render invalid mermaid visually",
    async () => {
      await expect(
        testScreenshotSnapshot("test/fixtures/invalid.in.md")
      ).rejects.toThrow("Parse error");
    },
    timeout
  );

  test(
    "should use puppeteer config",
    async () => {
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
      ).rejects.toThrow("Timed out");
    },
    timeout
  );

  test(
    "should use mermaid-cli to use forest theme",
    async () => {
      await testScreenshotSnapshot("test/fixtures/basic.in.md", {
        remarkOptions: {
          mermaidCli: {
            configFile: {
              theme: "forest",
            },
          },
        },
      });
    },
    timeout
  );

  test(
    "should set a red background",
    async () => {
      await testScreenshotSnapshot("test/fixtures/basic.in.md", {
        remarkOptions: {
          mermaidCli: {
            backgroundColor: "red",
          },
        },
      });
    },
    timeout
  );
});
