import memoize from "fast-memoize";
import mapToObject from "array-map-to-object";
import { relative } from "path";
import { arrify, getFilePathsRecursively, replaceExtension } from "../utils";

/**
 * Read partial file names and paths recursively from given directories.
 *
 * @param partialDirs are absolute paths of directories where partial files are located.
 * @param templateExtension is the file extension of the templates.
 * @returns parital names and paths as an object (`{ name => path, name => path }`). Keys (names) are relative path to partial dir, values (paths) are absolute paths.
 * @example
 * getPartialFiles("/some/path/partials", "hbs"); // { "main": "/some/path/partials/main.hbs", "top/box": "/some/path/partials/top/box.hbs" }
 */
async function getPartialFiles(partialDirs: string | string[], templateExtension?: string): Promise<Record<string, string>> {
  const itemsByDir = await Promise.all(
    arrify(partialDirs).map(async (partialDir) => {
      const items = await getFilePathsRecursively(partialDir, { extensions: templateExtension });
      return mapToObject(items, (item) => [replaceExtension(relative(partialDir, item)), item]);
    })
  );
  // Join all objects into single object.
  return itemsByDir.reduce((cumulativeItems, currentItems) => ({ ...cumulativeItems, ...currentItems }), {});
}

export default memoize(getPartialFiles);
