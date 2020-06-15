const fs = require("fs");
const remark = require("remark");

const remarkMermaidDataurl = require("../index.js");

describe("test markdown files", () => {
  let remarkProcessor;

  beforeEach(() => {
    remarkProcessor = remark().use(remarkMermaidDataurl);
  });

  test("should render basic.md without errors", async () => {
    const infile = fs.promises.readFile("test/fixtures/basic.in.md", {
      encoding: "utf8",
    });

    const file = await remarkProcessor.process(await infile);
    const outfile = file.contents;
    await fs.promises.writeFile("test/fixtures/basic.out.md", outfile, {
      encoding: "utf8",
    });
  });
});
