import memoize from "mem";
import { basename, extname } from "path";
import camelCase from "lodash.camelcase";
import { arrify, requireContextSource } from "../utils";

/**
 * Returns joined data required from `sources`.
 *
 * @param sources is single or multiple modules or file paths to get context data from.
 * @param isRootObject if `true` data is merged directly to context, otherwise data is added to the key which is equal to camel case of source name.
 * @returns context data read from sources.
 * @example
 * readContext("some/path/my-data.js", false); // { name: "abc" }
 * readContext("some/path/my-data.js", true);  // { myData: { name: "abc" } }
 */
export function readContext(sources?: string | string[], isRootObject?: boolean): Record<string, any> {
  return arrify(sources || []).reduce((context, source) => {
    const currentContext = requireContextSource(source);
    const key = camelCase(basename(source, extname(source)));
    return isRootObject ? { ...context, ...currentContext } : { ...context, [key]: currentContext };
  }, {});
}

export default memoize(readContext, { maxAge: 10000 });
