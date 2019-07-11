import { join } from "path";
import { readContext, replaceExtension, getFilePathsRecursively, getTemplateFilesFromDir } from "../src/utils";

function sort(data: any): any {
  return { allPartialDirs: data.allPartialDirs.sort(), templateFiles: data.templateFiles.sort() };
}

describe("utils", () => {
  describe("readContext", () => {
    it("should return if sources are undfined.", async () => {
      const expected = await readContext();
      expect(expected).toEqual({});
    });
  });

  describe("replaceExtension", () => {
    it("should replace extensiın with given extension.", () => {
      expect(replaceExtension("a.x", "y")).toBe("a.y");
    });
  });

  describe("getFilePathsRecursively", () => {
    it("should return files' relative paths.", async () => {
      const files = await getFilePathsRecursively(join(__dirname, "test-helper/scan-folder"), { returnRelative: true });
      expect(files).toEqual(["sub/file.txt"]);
    });
  });

  describe("getTemplateFilesFromDir", () => {
    it("should throw if no extension is provided.", async () => {
      await expect(getTemplateFilesFromDir({} as any)).rejects.toThrow("Template extension is required");
    });

    it("should return template files and partial dirs.", async () => {
      const expected = {
        allPartialDirs: ["/Users/ozum/Development/measy/test/test-helper/handlebars/partials"],
        templateFiles: [
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc-arg-context.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc-complex.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc-partials-without-meta.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc-partials.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc-with-helpers.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/partials2/basic2.hbs", // No meta-data provided and this dir is not added partial files using arg.
          "/Users/ozum/Development/measy/test/test-helper/handlebars/sub-dir-template/hello.hbs",
        ],
      };

      const files = await getTemplateFilesFromDir({
        dir: join(__dirname, "test-helper/handlebars"),
        templateExtension: "hbs",
      });
      expect(sort(files)).toEqual(sort(expected));
    });

    it("should return template files and partial dirs using relative dir.", async () => {
      const expected = {
        allPartialDirs: [
          "/Users/ozum/Development/measy/test/test-helper/handlebars/partials",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/partials2",
        ],
        templateFiles: [
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc-arg-context.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc-complex.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc-partials-without-meta.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc-partials.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc-with-helpers.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/doc.hbs",
          "/Users/ozum/Development/measy/test/test-helper/handlebars/sub-dir-template/hello.hbs",
        ],
      };

      const files = await getTemplateFilesFromDir({
        dir: join(__dirname, "test-helper/handlebars"),
        templateExtension: "hbs",
        partialDirs: ["partials", "partials2"],
      });
      expect(sort(files)).toEqual(sort(expected));
    });
  });
});
