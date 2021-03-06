#!/usr/bin/env node
/* eslint-disable no-console */
import meow, { Options as meowOptions } from "meow";
import { resolve } from "path";
import fs from "fs";
import JSON5 from "json5";
import { EOL } from "os";
import { write, writeDir } from "../index";

const { lstat } = fs.promises;

interface Result extends meow.Result<any> {
  flags: {
    templateExtension: string;
    targetExtension: string;
    out: string;
    context: string;
    contextFiles: string;
    rootContextFiles: string;
    partialDirs: string;
    functionFiles: string;
    rootFunctionFiles: string;
    excludePaths: string;
    engine: string;
    includeMeta: boolean;
    debug: boolean;
    silence: boolean;
    [name: string]: any;
  };
}

const FLAGS: meowOptions<any>["flags"] = {
  templateExtension: { type: "string" },
  targetExtension: { type: "string" },
  out: { type: "string" },
  context: { type: "string", default: "{}" },
  contextFiles: { type: "string", default: "" },
  rootContextFiles: { type: "string", default: "" },
  partialDirs: { type: "string", default: "" },
  functionFiles: { type: "string", default: "" },
  rootFunctionFiles: { type: "string", default: "" },
  excludePaths: { type: "string", default: "" },
  engine: { type: "string" },
  includeMeta: { type: "boolean" },
  debug: { type: "boolean" },
  silence: { type: "boolean" },
};

const HELP = `
Usage
  $ measy <template files or dir>

Options
  --template-extension (Required for dir) - File extension of the templates.
  --target-extension <extension>          - File extension to be used in generated files. If template file has 'extension' meta data (frontmatter), extension in meta data has higher precedence.
  --out <path>                            - File path (for templates) or directory path (for directory input) to generate files into. Defaults to <template path>.
  --context <json5>                       - Data to be passed to templates.
  --context-files <paths>                 - js, ts, JSON5 or YAML files to get data to be passed to templates under a key same as file name.
  --root-context-files                    - js, ts, JSON5 or YAML files to get data to be passed to templates.
  --partial-dirs <paths csv>              - Paths of directories which contains partial files.
  --function-files <paths csv>            - Files to get filter/helper functions prefixed with file name. i.e "uc()" func in "path/helper.js" becomes "helperUc" helper/filter.
  --root-function-files <paths csv>       - Files to get filter/helper functions prefixed with file name. i.e "uc()" func in "path/helper.js" becomes "uc" helper/filter.
  --exclude-paths <paths csv>             - Paths to be excluded (for directory input only)
  --engine <engine name>                  - Template engine to be used. Supports engines supported by consolidate (https://www.npmjs.com/package/consolidate).
  --include-meta                          - Whether to include meta data in generated files.
  --debug                                 - Print stack trace in errors.
  --silence                               - Prevent console output.

Examples
  $ measy --context-files package.json README.njk
  $ measy --context '{ codeName: "Jay" }' --out last.txt member.hbs
  $ measy --out docs my-templates
`;

/**
 * Splites CSV string of paths from CLI into array of absolute paths.
 *
 * @param pathsCSV is comma split values of paths to split.
 * @returns array of absolute paths converted from relative to cwd().
 */
function splitPaths(pathsCSV: string): string[] {
  return pathsCSV ? pathsCSV.split(/\s*,\s*/).map((f) => resolve(f)) : [];
}

async function measy(): Promise<void> {
  const cli = meow(HELP, { flags: FLAGS }) as Result;
  const path = cli.input[0];

  if (!path || path.length === 0) {
    console.log(`${HELP}${EOL}Error: Template files or dir is required`);
    return;
  }

  const flags = {
    ...cli.flags,
    context: JSON5.parse(cli.flags.context) as Record<string, any>,
    contextFiles: splitPaths(cli.flags.contextFiles),
    rootContextFiles: splitPaths(cli.flags.rootContextFiles),
    partialDirs: splitPaths(cli.flags.partialDirs),
    excludePaths: splitPaths(cli.flags.excludePaths),
    functionFiles: splitPaths(cli.flags.functionFiles),
    rootFunctionFiles: splitPaths(cli.flags.rootFunctionFiles),
  };

  try {
    const paths = cli.input.map((p) => resolve(p));
    const stat = await lstat(paths[0]);
    const isDirectory = stat.isDirectory();
    const unknownOption = Object.keys(flags).find((key) => FLAGS && !FLAGS[key]);
    if (unknownOption) {
      throw new Error(`Unknown option '${unknownOption}'`);
    }
    await (paths.length === 1 && isDirectory ? writeDir(paths[0], flags as any) : write(paths, flags as any));
  } catch (e) {
    if (flags.debug) {
      throw e;
    } else {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  }

  console.log("Finished.");
}

measy();
