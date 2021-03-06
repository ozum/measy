import memoize from "fast-memoize";
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
async function readContext(sources?: string | string[], isRootObject?: boolean): Promise<Record<string, any>> {
  const parsedSources = await Promise.all(
    arrify(sources || []).map(async (source) => {
      const parsedSource = await requireContextSource(source);
      const key = camelCase(basename(source, extname(source)));
      return isRootObject ? parsedSource : { [key]: parsedSource };
    })
  );
  return parsedSources.reduce((context, currentContext) => ({ ...context, ...currentContext }), {});
}

export default memoize(readContext);
