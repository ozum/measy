import fs from "fs";
import { join, normalize } from "path";
import { compare } from "dir-compare";
import del from "del";
import execa from "execa";
import { write, writeDir, render, isEngineSupported, engineOfExtension } from "../src/index";

const { readFile } = fs.promises;

const getExpected = (file: string) => readFile(join(__dirname, "test-helper/expected", file), { encoding: "utf8" });
const getDifferenceOfDirs = (path1: string, path2: string): Promise<number> =>
  compare(join(__dirname, "test-helper", path1), join(__dirname, "test-helper", path2), {
    compareContent: true,
  }).then(comparison => comparison.differences);

afterAll(async () => {
  await del(join(__dirname, "test-helper/temp-out"));
  await del(join(__dirname, "test-helper/temp-measy-out"));
  await del(join(__dirname, "test-helper/handlebars/sub-dir-template/hello"));
});

describe("engineOfExtension", () => {
  it("should return engine for known extension", () => {
    expect(engineOfExtension("hbs")).toBe("handlebars");
  });

  it("should return engine for known extension with dot", () => {
    expect(engineOfExtension(".hbs")).toBe("handlebars");
  });
});

describe("isEngineSupported", () => {
  it("should return true for supported engine", () => {
    expect(isEngineSupported("nunjucks")).toBe(true);
  });

  it("should return false for unsupported engine", () => {
    expect(isEngineSupported("xyz")).toBe(false);
  });
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

  it("should render handlebars tempate with helpers/filters.", async () => {
    const rendered = await render({
      template: join(__dirname, "test-helper/handlebars/doc-with-helpers.hbs"),
      // functionFiles: [join(__dirname, "test-helper/functions-js.js"), join(__dirname, "test-helper/functions-ts.ts")],
      // rootFunctionFiles: [join(__dirname, "test-helper/functions-js.js"), join(__dirname, "test-helper/functions-ts.ts")],
      functionFiles: join(__dirname, "test-helper/functions-ts.ts"),
      rootFunctionFiles: join(__dirname, "test-helper/functions-ts.ts"),
    });
    const expected = await getExpected("doc-with-functions.txt");
    expect(rendered).toBe(expected);
  });

  it("should render nunjucks tempate with helpers/filters.", async () => {
    const rendered = await render({
      template: join(__dirname, "test-helper/nunjucks/doc-with-filters.njk"),
      functionFiles: join(__dirname, "test-helper/functions-ts.ts"),
      rootFunctionFiles: join(__dirname, "test-helper/functions-ts.ts"),
    });
    const expected = await getExpected("doc-with-functions.txt");
    expect(rendered).toBe(expected);
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
      functionFiles: join(__dirname, "test-helper/functions-ts.ts"),
      rootFunctionFiles: join(__dirname, "test-helper/functions-ts.ts"),
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

describe("measy", () => {
  it("should write all templates in given dir to out dir.", async () => {
    // await execa.node(join(__dirname, "../../src/bin/measy.ts"), ["test-helper/handlebars/sub-dir-template/hello.hbs"]);
    // await (execa("ts-node", [join(__dirname, "../../src/bin/measy.ts")]).stdout as any).pipe(process.stdout);
    const cwd = __dirname;
    const measyScript = normalize("../src/bin/measy.ts");
    const templateDir = normalize("test-helper/handlebars");

    await execa(
      "ts-node",
      [
        measyScript,
        templateDir,
        "--template-extension",
        "hbs",
        "--target-extension",
        "md",
        "--out",
        normalize("test-helper/temp-measy-out/handlebars"),
        "--partial-dirs",
        normalize("test-helper/handlebars/partials2"),
        "--context-files",
        normalize("test-helper/arg-context.json"),
        "--root-context-files",
        normalize("test-helper/arg-context.json"),
        "--function-files",
        `${normalize("test-helper/functions-ts.ts")}`,
        "--root-function-files",
        `${normalize("test-helper/functions-ts.ts")}`,
      ],
      {
        cwd,
      }
    );
    const expected = await getDifferenceOfDirs("expected/handlebars-write-dir", "temp-measy-out/handlebars");
    expect(expected).toBe(0);
  });
});
