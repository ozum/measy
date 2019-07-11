import memoize from "mem";
import { basename, extname, relative } from "path";
import camelCase from "lodash.camelcase";
import { arrify, ucFirst } from "../utils";

export function getFunctions(sources?: string | string[], isRoot?: boolean): Record<string, (...args: any[]) => any> {
  return arrify(sources).reduce((cumulativeFunctions, source) => {
    const required = require(relative(__dirname, source)); // eslint-disable-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
    const functions = required.default ? required.default : required; // To get data from  `export.default`.
    const key = camelCase(basename(source, extname(source)));
    if (isRoot) {
      return { ...cumulativeFunctions, ...functions };
    }
    const nonRootFunctions: Record<string, Function> = {};
    Object.entries(functions).forEach(([name, func]) => {
      nonRootFunctions[`${key}${ucFirst(name)}`] = func as Function;
    });

    return { ...cumulativeFunctions, ...nonRootFunctions };
  }, {});
}

export default memoize(getFunctions, { maxAge: 10000 });
