import fs from "fs";
import { join } from "path";
import { compare } from "dir-compare";
import del from "del";
import { write, writeDir, render } from "../src/index";

const { readFile } = fs.promises;

const getExpected = (file: string) => readFile(join(__dirname, "test-helper/expected", file), { encoding: "utf8" });
const getDifferenceOfDirs = (path1: string, path2: string): Promise<number> =>
  compare(join(__dirname, "test-helper", path1), join(__dirname, "test-helper", path2), {
    compareContent: true,
  }).then(comparison => comparison.differences);

afterAll(async () => {
  // await del(join(__dirname, "test-helper/temp-out"));
  await del(join(__dirname, "test-helper/handlebars/sub-dir-template/hello"));
});

describe("render", () => {
  it("should throw for unknown engine.", async () => {
    await expect(render({ template: join(__dirname, "test-helper/nunjucks/doc.njk"), engine: "xyz" as any })).rejects.toThrow(
      "unknown engine"
    );
  });

  it("should render basic nunjucks file.", async () => {
    const rendered = await render({ template: join(__dirname, "test-helper/nunjucks/doc.njk"), context: { name: "George" } });
    const expected = await getExpected("basic-render.txt");
    expect(rendered).toBe(expected);
  });

  it("should render basic handlebars file.", async () => {
    const rendered = await render({ template: join(__dirname, "test-helper/handlebars/doc.hbs"), context: { name: "George" } });
    const expected = await getExpected("basic-render.txt");
    expect(rendered).toBe(expected);
  });

  it("should render complex handlebars file.", async () => {
    const rendered = await render({ template: join(__dirname, "test-helper/handlebars/doc-complex.hbs"), context: { name: "George" } });
    const expected = await getExpected("doc-complex.txt");
    expect(rendered).toBe(expected);
  });

  it("should render complex handlebars file including meta data.", async () => {
    const rendered = await render({
      template: join(__dirname, "test-helper/handlebars/doc-complex.hbs"),
      context: { name: "George" },
      includeMeta: true,
    });
    const expected = await getExpected("doc-complex-with-meta.txt");
    expect(rendered).toBe(expected);
  });

  it("should render mustache template.", async () => {
    const rendered = await render({ template: join(__dirname, "test-helper/mustache/doc.mustache"), context: { name: "George" } });
    const expected = await getExpected("basic-render.txt");
    expect(rendered).toBe(expected);
  });

  it("should render by parsing JSON5 file without file extension", async () => {
    const rendered = await render({
      template: join(__dirname, "test-helper/handlebars/doc.hbs"),
      rootContextFiles: join(__dirname, "test-helper/data-json"),
    });
    const expected = "name:json5\npackage.name:\nversion:\npackage.version:\n";
    expect(rendered).toBe(expected);
  });

  it("should render by parsing YAML file without file extension", async () => {
    const rendered = await render({
      template: join(__dirname, "test-helper/handlebars/doc.hbs"),
      rootContextFiles: join(__dirname, "test-helper/data-yaml"),
    });
    const expected = "name:yaml\npackage.name:\nversion:\npackage.version:\n";
    expect(rendered).toBe(expected);
  });

  it("should throw when parsing malformed YAML file without file extension", async () => {
    await expect(
      render({
        template: join(__dirname, "test-helper/handlebars/doc.hbs"),
        rootContextFiles: join(__dirname, "test-helper/data-yaml-malformed"),
      })
    ).rejects.toThrow("Cannot parse data as JSON5 or YAML");
  });

  it("should throw for unsupported type of files.", async () => {
    await expect(
      render({
        template: join(__dirname, "test-helper/handlebars/doc.hbs"),
        rootContextFiles: join(__dirname, "test-helper/xyz.xyz"),
      })
    ).rejects.toThrow("files are not supported");
  });
});

describe("write", () => {
  it("should throw if directory is provided for input.", async () => {
    await expect(write(join(__dirname, "test-helper/handlebars"))).rejects.toThrow("Directories are not supported");
  });

  it("should write given file", async () => {
    await write(join(__dirname, "test-helper/handlebars/sub-dir-template/hello.hbs"), { silent: true });
    const expected = await getDifferenceOfDirs("expected/handlebars-same-dir", "handlebars/sub-dir-template");
    expect(expected).toBe(0);
  });
});

describe("writeDir", () => {
  it("should write all templates in given dir with absolute out dir.", async () => {
    await writeDir(join(__dirname, "test-helper/handlebars"), {
      templateExtension: "hbs",
      targetExtension: "md",
      out: join(__dirname, "test-helper/temp-out/handlebars"),
      partialDirs: join(__dirname, "test-helper/handlebars/partials2"),
      contextFiles: join(__dirname, "test-helper/arg-context.json"),
      rootContextFiles: join(__dirname, "test-helper/arg-context.json"),
      silent: true,
    });
    const expected = await getDifferenceOfDirs("expected/handlebars-write-dir", "temp-out/handlebars");
    expect(expected).toBe(0);
  });

  it("should write all templates in same dir.", async () => {
    await writeDir(join(__dirname, "test-helper/handlebars/sub-dir-template"), {
      templateExtension: "hbs",
      silent: true,
    });
    const expected = await getDifferenceOfDirs("expected/handlebars-same-dir", "handlebars/sub-dir-template");
    expect(expected).toBe(0);
  });
});
