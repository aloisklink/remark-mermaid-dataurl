const fs = require("fs");
const remark = require("remark");
const html = require("remark-html");
const puppeteer = require("puppeteer");
const { toMatchImageSnapshot } = require("jest-image-snapshot");

const remarkMermaidDataurl = require("../index.js");

expect.extend({ toMatchImageSnapshot });
jest.setTimeout(30000); // 30 seconds since mermaid-cli is slow

describe("test markdown files", () => {
  test("should render basic.md without errors", async () => {
    const infile = fs.promises.readFile("test/fixtures/basic.in.md", {
      encoding: "utf8",
    });

    const file = await remark()
      .use(remarkMermaidDataurl)
      .process(await infile);
    const outfile = file.contents;
    await fs.promises.writeFile("test/fixtures/basic.out.md", outfile, {
      encoding: "utf8",
    });
  });
  test("should render basic.md visually", async () => {
    const infile = fs.promises.readFile("test/fixtures/basic.in.md", {
      encoding: "utf8",
    });

    const htmlFile = (
      await remark()
        .use(remarkMermaidDataurl)
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
      blur: 2,
    });
  });
});
