import memoize from "mem";
import { relative, extname } from "path";
import JSON5 from "json5";
import yaml from "js-yaml";
import fs from "fs";

const { readFile } = fs.promises;

/**
 * Parses given string and returns object. If no format given, tries to parse first as json, then yaml.
 *
 * @param content is string to parse
 * @returns parsed object
 * @throws `Error` if data cannot be parsed.
 */
export function parseString(content: string): Record<string, any> {
  const errors: Error[] = [];

  try {
    return JSON5.parse(content);
  } catch (e) {
    errors.push(e);
  }

  try {
    return yaml.safeLoad(content);
  } catch (e) {
    errors.push(e);
  }

  const errorMessage = errors.reduce((previous, e) => `${previous}${e.name}: ${e.message}. `, "").trim();
  throw new Error(`Cannot parse data as JSON5 or YAML. ${errorMessage}`);
}

const PARSERS: { [key: string]: (content: string) => Record<string, any> } = {
  ".yaml": yaml.safeLoad,
  ".yml": yaml.safeLoad,
  ".json": JSON5.parse,
  "": parseString,
};

/**
 * Returns context data read from source.
 *
 * @param source module or file to get context data from.
 * @returns context data read from source.
 */
async function requireContextSource(source: string): Promise<Record<string, any>> {
  const extension = extname(source);
  const parserFunction = PARSERS[extension];

  if (extension === ".js" || extension === ".ts") {
    const required = require(relative(__dirname, source)); // eslint-disable-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
    return required.default ? required.default : required; // To get data from  `export.default`.
  }

  if (!parserFunction) {
    throw new Error(`'${extension}' files are not supported for parsing.`);
  }

  // Read file and parse it's content using one of the supported parsers.
  const content = await readFile(source, { encoding: "utf8" });
  const context = parserFunction(content);

  return context;
}

export default memoize(requireContextSource, { maxAge: 10000 });
