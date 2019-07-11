import consolidate from "consolidate";

export interface RenderOptions {
  template: string;
  context?: Record<string, any>;
  contextFiles?: string | string[];
  rootContextFiles?: string | string[];
  partialDirs?: string | string[];
  engine?: SupportedEngine;
  includeMeta?: boolean;
  functionFiles?: string | string[];
  rootFunctionFiles?: string | string[];
}

export interface MetaData {
  body: string;
  context: Record<string, any>;
  partialDirs: string[];
  targetExtension?: string;
  functions: Record<string, (...args: any[]) => any>;
}

/**
 * Type for supported engines as a string.
 */
export type SupportedEngine = keyof typeof consolidate;

export interface WriteOptions {
  /**
   * File to be created using `file` template.
   */
  out?: string;
  /**
   * Data to be used in template.
   */
  context?: Record<string, any>;
  /**
   * Files to get data to be passed to templates under a key same as file name.
   */
  contextFiles?: string | string[];
  /**
   * Files to get data to be passed to templates.
   */
  rootContextFiles?: string | string[];
  /**
   * Directories of partial files to be used.
   */
  partialDirs?: string | string[];
  /**
   * Files to get filter/helper functions prefixed with file name. i.e "uc()" func in "path/helper.js" becomes "helperUc" helper/filter.
   */
  functionFiles?: string | string[];
  /**
   * Files to get filter/helper functions prefixed with file name. i.e "uc()" func in "path/helper.js" becomes "uc" helper/filter.
   */
  rootFunctionFiles?: string | string[];
  /**
   * Template engine to be used.
   */
  engine?: SupportedEngine;
  /**
   * Whether to include meta data (frontmatter) contained in tempates into created file.
   */
  includeMeta?: boolean;
  /**
   * Whether to silence output.
   */
  silent?: boolean;
}

export interface WriteDirOptions extends WriteOptions {
  /**
   * File extension of the templates.
   */
  templateExtension: string;
  /**
   * File extension to be used in generated files. If template file has `extension` meta data (frontmatter), extension in meta data has higher precedence.
   */
  targetExtension?: string;
  /**
   * Paths to be excluded.
   */
  excludePaths?: string | string[];
}
