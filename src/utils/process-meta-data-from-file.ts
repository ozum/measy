import memoize from "mem";
import frontMatter from "front-matter";
import fs from "fs";
import { join, dirname } from "path";
import { arrify, readContext, toAbsolute } from "../utils";
import { MetaData } from "../types";

const { readFile } = fs.promises;

/**
 * Reads FrontMatter YAML data from beginning of given file then
 * - fetches context data from requested files,
 * - calculates absolute `partialDirs`
 *
 * YAML attributes are as follows:
 * `context` is file name or array of file names to require to get context data for template. File name without extension is used as key.
 * `rootContext` is file name or array of file names to require to get context data for template. Result is merged into context directly.
 * `partials` is path or array of paths relative to file to get partials from.
 * `extension` is used if there is no out attribute. Sets filename extension of output file.
 * For example assuming `data.json` has `{ "option": "red" }`
 *
 * ```
 * ---
 * rootContext: data.json
 * context: package.json
 * ---
 * ```
 * results with
 * ```
 * {
 *   package: { name: "some-module" },  // context data added to the key which is equal to file name.
 *   option: "red"                      // rootContext data added directly to context
 * }
 * ```
 *
 * @param file is file to process meta data for.
 * @returns processed data.
 */
async function processMetaDataFromFile(file: string): Promise<MetaData> {
  const content = await readFile(file, { encoding: "utf8" });
  const { attributes, body } = frontMatter(content);
  const result: MetaData = {
    partialDirs: attributes.partials ? arrify(attributes.partials).map(partial => join(dirname(file), partial)) : [],
    context: {
      ...(await readContext(toAbsolute(file, attributes.context), false)),
      ...(await readContext(toAbsolute(file, attributes.rootContext), true)),
    },
    body,
    extension: attributes.extension,
  };
  return result;
}

export default memoize(processMetaDataFromFile, { maxAge: 10000 });
