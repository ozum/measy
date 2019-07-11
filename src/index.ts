import consolidate from "consolidate";
import nunjucks from "nunjucks";
import Handlebars from "handlebars";
import { join, extname, relative, dirname } from "path";
import fs from "fs";
import makeDir from "make-dir";
import frontMatter from "front-matter";
import { RenderOptions, WriteOptions, WriteDirOptions } from "./types";
import {
  getPartialFiles,
  getTemplateFilesFromDir,
  processMetaDataFromFile,
  replaceExtension,
  readContext,
  arrify,
  getFunctions,
} from "./utils";

const { writeFile } = fs.promises;

/**
 * @ignore
 */
const extensionEngines: Record<string, keyof typeof consolidate> = {
  njk: "nunjucks",
  hbs: "handlebars",
  handlebars: "handlebars",
  mustache: "mustache",
};

/**
 * Returns engine for an extension. Not all extension/engine pairs can be mapped, because some engines may not have
 * file extensions and some engines shares same extension such as `html`.
 *
 * @param extension is extension to check.
 * @returns engine for given `extension`.
 * @example
 * engineOfExtension(".hbs"); // "handlebars"
 * engineOfExtension("hbs"); // "handlebars"
 */
export function engineOfExtension(extension: string): keyof typeof consolidate | undefined {
  const extensionWithoutDot = extension.startsWith(".") ? extension.slice(1) : extension;
  return extensionEngines[extensionWithoutDot];
}

/**
 * Returns whether template engine is supported.
 *
 * @param engineName is name of the template engine to check support for.
 * @returns whether engine is supported.
 */
export function isEngineSupported(engineName: string): boolean {
  return consolidate[engineName as keyof typeof consolidate] !== undefined;
}

/**
 * Renders and returns given template.
 *
 * @param options are render options.
 * @returns rendered template.
 */
export async function render(options: RenderOptions): Promise<string> {
  const meta = await processMetaDataFromFile(options.template);
  const context = { ...meta.context, ...options.context, cache: true };
  const engine = options.engine || extensionEngines[extname(options.template).slice(1)];
  const partialDirs = meta.partialDirs.concat(arrify(options.partialDirs));
  const templateExtension = extname(options.template).slice(1);
  const contextFromFiles = options.contextFiles ? await readContext(options.contextFiles) : {};
  const rootContextFromFiles = options.rootContextFiles ? await readContext(options.rootContextFiles, true) : {};
  const functions = { ...meta.functions, ...getFunctions(options.functionFiles, false), ...getFunctions(options.rootFunctionFiles, true) };

  let partials: Record<string, string> = {};

  if (engine === "nunjucks") {
    const nunjucksEnv = nunjucks.configure(partialDirs);
    consolidate.requires.nunjucks = nunjucksEnv;
    Object.keys(functions).forEach(name => nunjucksEnv.addFilter(name, functions[name]));
  } else if (engine === "handlebars") {
    Object.keys(functions).forEach(name => Handlebars.registerHelper(name, functions[name]));
    consolidate.requires.handlebars = Handlebars;
    // Clone value! because consolidate.renderer modifies it, and since getPartialFiles is memozied, it's original value is modified for consecutive calls.
    partials = { ...(await getPartialFiles(partialDirs, templateExtension)) };
  } else if (!consolidate[engine]) {
    throw new Error(`No engine provided or unknown engine: ${engine}`);
  }

  const renderer = consolidate[engine] as typeof consolidate.nunjucks; // RendererInterface type is not exported from consolidate
  return renderer(options.template, { partials, ...context, ...contextFromFiles, ...rootContextFromFiles }).then(content =>
    options.includeMeta ? content : frontMatter(content).body
  );
}

/**
 * Creates a file for given template.
 *
 * @param templates are template file to create output for.
 * @param out is file to be created using `file` template.
 * @param context is data to be used in template.
 * @param contextFiles are files to get data to be passed to templates under a key same as file name.
 * @param rootContextFiles are files to get data to be passed to templates.
 * @param partialDirs are directories of partial files to be used.
 * @param engine is template engine to be used.
 * @param includeMeta is whether to include meta data (frontmatter) contained in tempates into created file.
 */
export async function write(
  templates: string | string[],
  {
    out,
    context,
    contextFiles,
    rootContextFiles,
    partialDirs = [],
    functionFiles,
    rootFunctionFiles,
    engine,
    includeMeta,
    silent,
  }: WriteOptions = {}
): Promise<void[]> {
  return Promise.all(
    arrify(templates).map(
      async (template: string): Promise<void> => {
        try {
          const meta = await processMetaDataFromFile(template);
          const targetFile = out || replaceExtension(template, meta.targetExtension);
          const content = await render({
            template,
            context,
            contextFiles,
            rootContextFiles,
            partialDirs,
            functionFiles,
            rootFunctionFiles,
            engine,
            includeMeta,
          });
          await makeDir(dirname(targetFile));
          /* istanbul ignore next */
          if (!silent) {
            console.log(`File written: ${targetFile}`); // eslint-disable-line no-console
          }
          return writeFile(targetFile, content);
        } catch (e) {
          /* istanbul ignore else */
          if (e.code === "EISDIR") {
            throw new Error(`${template} is a directory. Directories are not supported when multiple templates provided.`);
          } else {
            throw e;
          }
        }
      }
    )
  );
}

/**
 * Scans given directory recursively and creates a file for each template.
 *
 * @param dir is path of directory to render templates recursively.
 * @param templateExtension is file extension of the templates.
 * @param targetExtension is file extension to be used in generated files. If template file has `extension` meta data (frontmatter), extension in meta data has higher precedence.
 * @param outDir is directory to generate files into.
 * @param context is data to be passed to templates.
 * @param contextFiles are files to get data to be passed to templates under a key same as file name.
 * @param rootContextFiles are files to get data to be passed to templates.
 * @param partialDirs are paths of directories which contains partial files.
 * @param excludePaths are paths to be excluded.
 * @param engine is the template engine to be used. Supports engines supported by [consolidate](https://www.npmjs.com/package/consolidate). See it's page.
 * @param includeMeta whether to include meta data in generated files.
 */
export async function writeDir(
  dir: string,
  {
    templateExtension,
    targetExtension,
    out = dir,
    context,
    contextFiles,
    rootContextFiles,
    partialDirs = [],
    functionFiles,
    rootFunctionFiles,
    excludePaths = [],
    engine = extensionEngines[templateExtension],
    includeMeta,
    silent,
  }: WriteDirOptions
): Promise<void> {
  const { templateFiles } = await getTemplateFilesFromDir({ dir, templateExtension, partialDirs, excludePaths });

  await Promise.all(
    templateFiles.map(async template => {
      const meta = await processMetaDataFromFile(template);
      const extension = meta.targetExtension || targetExtension || "";
      const targetFile = replaceExtension(join(out, relative(dir, template)), extension);
      await write(template, {
        out: targetFile,
        context,
        contextFiles,
        rootContextFiles,
        partialDirs,
        functionFiles,
        rootFunctionFiles,
        engine,
        includeMeta,
        silent,
      });
    })
  );
}
