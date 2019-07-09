import { parse, join, relative, dirname, isAbsolute } from "path";
import globby from "globby";
import processMetaDataFromFile from "./utils/process-meta-data-from-file";
import readContext from "./utils/read-context";
import requireContextSource from "./utils/require-context-source";
import getPartialFiles from "./utils/get-partial-files";

export { processMetaDataFromFile, readContext, requireContextSource, getPartialFiles };

/**
 * Makes given input array and returns it.
 *
 * @param input to construct array from
 * @returns created array.
 */
export function arrify<T>(input: T | T[] = []): T[] {
  return Array.isArray(input) ? input : [input];
}

/**
 * Converts given `paths` from relative to `baseFile` to absolute `paths` and returns as an array.
 *
 * @param baseFile is the path of file which paths are relative to.
 * @param paths are converted to absolute.
 * @returns aboslute paths.
 */
export function toAbsolute(baseFile: string, paths: string | string[]): string[] {
  return arrify(paths).map(path => join(dirname(baseFile), path));
}

/**
 * Replaces extension of given path with a new extension.
 *
 * @param path to replace extension of.
 * @param newExtension is extension to replace old one.
 * @returns path with new extension.
 */
export function replaceExtension(path: string, newExtension: string = ""): string {
  const newExtensionWithDot = newExtension === "" || newExtension.startsWith(".") ? newExtension : `.${newExtension}`;
  const { dir, name } = parse(path);
  return `${join(dir, name)}${newExtensionWithDot}`;
}

/**
 * Returns files within `dir` recursively according to given options.
 *
 * @param dirs are the paths of directories to get files from.
 * @param extensions are list of extensions to filter files.
 * @param ignore glob patterns to exclude from result. `!` should not be added.
 * @param returnRelative is whether return results relative to `dir` or include `dir` in every path.
 * @example
 * // Ignores `node_modules` right in `dir` and `xyz` dir recursively in every level
 * getFilePathsRecursively("some/path", { extensions: ["js", "md"], ignore: ["node_modules", "**"+"/xyz"] });
 *
 * getFilePathsRecursively("some/path", { extensions: js, returnRelative: true }); // ["src/x.js", "src/y.js"]
 * getFilePathsRecursively("some/path", { extensions: js, returnRelative: false }); // ["some/path/src/x.js", "some/path/src/y.js"]
 */
export async function getFilePathsRecursively(
  dirs: string | string[],
  { extensions, ignore, returnRelative }: { extensions?: string | string[]; ignore?: string | string[]; returnRelative?: boolean }
): Promise<string[]> {
  const extensionPattern = extensions ? `{${arrify(extensions).join(",")}}` : "*"; // i.e. {md,js}
  const allPaths = await Promise.all(
    arrify(dirs).map(async dir => {
      const paths = await globby([`**/*.${extensionPattern}`], { cwd: dir, ignore: arrify(ignore) });
      return returnRelative ? paths : paths.map(path => join(dir, path));
    })
  );
  return allPaths.flat();
}

/**
 * Returns list of template files from given `dir` while excluding `partialDirs`, `excludePaths` nad partial dirs read from
 * meta data of template files.
 *
 * @param dir is path of directory to render templates recursively.
 * @param templateExtension file extension of the templates.
 * @param partialDirs are paths of directories which contains partial files.
 * @param excludePaths are paths to be excluded.
 * @returns array of absolute paths of template files and partial dirs.
 */
export async function getTemplateFilesFromDir({
  dir,
  templateExtension,
  partialDirs = [],
  excludePaths = [],
}: {
  dir: string;
  templateExtension: string;
  partialDirs?: string | string[];
  excludePaths?: string | string[];
}): Promise<{ templateFiles: string[]; allPartialDirs: string[] }> {
  if (!templateExtension) {
    throw new Error("Template extension is required.");
  }
  const templateFilesIncludingPartials = await getFilePathsRecursively(dir, {
    ignore: arrify(excludePaths).concat(arrify(partialDirs)),
    extensions: templateExtension,
  });

  // Scan files to get partial dirs defined in meta data of template files.
  const partialDirsFromMeta = await Promise.all(
    templateFilesIncludingPartials.map(async template => {
      const meta = await processMetaDataFromFile(template);
      return meta.partialDirs;
    })
  );

  const combinedRelativePartialDirs = partialDirsFromMeta
    .flat()
    .concat(partialDirs)
    .map(partialDir => (isAbsolute(partialDir) ? relative(dir, partialDir) : partialDir));

  const distinctPartialDirs = Array.from(new Set(combinedRelativePartialDirs));

  // Scan files again and exclude partials dirs defined in meta data of template files.
  const templateFiles = await getFilePathsRecursively(dir, {
    ignore: arrify(excludePaths).concat(distinctPartialDirs),
    extensions: templateExtension,
  });

  return { templateFiles, allPartialDirs: distinctPartialDirs.map(partialDir => join(dir, partialDir)) };
}
