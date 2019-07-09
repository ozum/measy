import memoize from "mem";
import { relative } from "path";

/**
 * Returns context data read from source.
 *
 * @param source module or file to get context data from.
 * @returns context data read from source.
 */
function requireContextSource(source: string): Record<string, any> {
  const required = require(relative(__dirname, source)); // eslint-disable-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
  return required.default ? required.default : required; // To get data from  `export.default`.
}

export default memoize(requireContextSource, { maxAge: 10000 });
