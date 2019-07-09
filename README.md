# measy

Create files using any template engine as simple as possible. Just a template and a JSON file is enough.

# Install

Install `measy` using `npm` or `yarn`.

```
$ npm install measy
$ yarn add measy
```

**NOTE**: If you wish to use template engines other than `nunjucks` or `handlebars`, you must install the engines you wish to use: Add them to your package.json dependencies or install globally.

# Examples

- Create README.md from nunjucks template using `package.json` data:

```
$ measy README.njk
```

- Long syntax without Front Matter:

```
$ measy --context-files package.json --out README.md README.njk
```

- Create a text file from handlebars template:

```
$ measy --context '{ codeName: "Jay" }' --out last.txt member.hbs
```

- Process all templates in a given directory:

```
$ measy --out docs my-templates
```

- Get help

```
$ measy --help
```

# Example Template

Templates support `Front Matter` data in YAML format.

**README.njk**, **README.hbs** etc.

```hbs
---
context: "package.json"
extension: "md"
---
# {{ package.name }}

{{ package.description }}

# Examples

...some examples
```

# Description

`measy` is simple command which creates files from templates combining data from JSON or JavaScript (or TypeScript with the help of `ts-node`) files. JSON files are parsed using [JSON5](https://json5.org/). JS files can be used by exporting an object with `module.exports` or `export default`.

## Front Matter

Any template file may contain a `YAML` front matter block. Data is processed by `measy`. The front matter must be the first thing in the file and must take the form of valid YAML set between triple-dashed (`---`) lines. Here is a basic example:

```yaml
---
context: "package.json"
rootContext: ["some.json", "lib/my-data.js"]
partials: ["templates/partials"]
extension: "md"
---

```

| Name        | Type              | Description                                                                                                                               |
| ----------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| context     | `string|string[]` | File name or array of file names to require to get context data for template. File name without extension is used as key in context data. |
| rootContext | `string|string[]` | File name or array of file names to require to get context data for template. Result is merged into context directly.                     |
| extension   | `string`          | If there is no out attribute, sets filename extension of output file.                                                                     |
| partials    | `string|string[]` | Path or array of paths relative to file to get partials from.                                                                             |

### Example

**package.json**

```json
{
  "name": "some-module",
  "version": "1.0.0"
}
```

```js
// context: "package.json"
{
  someOtherData: "Hello",
  package: {
    name: "some-module",
    version: "1.0.0"
  }
}

// rootContext: "package.json"
{
  someOtherData: "Hello",
  name: "some-module",
  version: "1.0.0"
}

```

## CLI Options

| Option Name                       | Description                                                                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--template-extension (Required)` | File extension of the templates.                                                                                                                      |
| `--target-extension <extension>`  | File extension to be used in generated files. If template file has 'extension' meta data (frontmatter), extension in meta data has higher precedence. |
| `--out <path>`                    | File path (for templates) or directory path (for directory input) to generate files into. Defaults to \<template path>.                               |
| `--context <json5>`               | Data to be passed to templates.                                                                                                                       |
| `--context-files <paths>`         | Files to get data to be passed to templates under a key same as file name.                                                                            |
| `--root-context-files`            | Files to get data to be passed to templates.                                                                                                          |
| `--partial-dirs <paths csv>`      | Paths of directories which contains partial files.                                                                                                    |
| `--exclude-paths <paths csv>`     | Paths to be excluded (for directory input only)                                                                                                       |
| `--engine <engine name>`          | Template engine to be used. Supports engines supported by [consolidate](https://www.npmjs.com/package/consolidate).                                    |
| `--include-meta`                  | Whether to include meta data in generated files.                                                                                                      |
| `--debug`                         | Print stack trace in errors.                                                                                                                          |
| `--silence`                       | Prevent console output.                                                                                                                               |

## Supported Template Engines

Thanks to [Consolidate.js](https://www.npmjs.com/package/consolidate)

- [atpl](https://github.com/soywiz/atpl.js)
- [bracket](https://github.com/danlevan/bracket-template)
- [doT.js](https://github.com/olado/doT) [(website)](http://olado.github.io/doT/)
- [dust (unmaintained)](https://github.com/akdubya/dustjs) [(website)](http://akdubya.github.com/dustjs/)
- [dustjs-linkedin (maintained fork of dust)](https://github.com/linkedin/dustjs) [(website)](http://linkedin.github.io/dustjs/)
- [eco](https://github.com/sstephenson/eco)
- [ect](https://github.com/baryshev/ect) [(website)](http://ectjs.com/)
- [ejs](https://github.com/mde/ejs) [(website)](http://ejs.co/)
- [haml](https://github.com/visionmedia/haml.js)
- [haml-coffee](https://github.com/9elements/haml-coffee)
- [hamlet](https://github.com/gregwebs/hamlet.js)
- [handlebars](https://github.com/wycats/handlebars.js/) [(website)](http://handlebarsjs.com/)
- [hogan](https://github.com/twitter/hogan.js) [(website)](http://twitter.github.com/hogan.js/)
- [htmling](https://github.com/codemix/htmling)
- [jade](https://github.com/visionmedia/jade) [(website)](http://jade-lang.com/)
- [jazz](https://github.com/shinetech/jazz)
- [jqtpl](https://github.com/kof/jqtpl)
- [JUST](https://github.com/baryshev/just)
- [liquid](https://github.com/leizongmin/tinyliquid) [(website)](http://liquidmarkup.org/)
- [liquor](https://github.com/chjj/liquor)
- [lodash](https://github.com/bestiejs/lodash) [(website)](http://lodash.com/)
- [marko](https://github.com/marko-js/marko) [(website)](http://markojs.com)
- [mote](https://github.com/satchmorun/mote) [(website)](http://satchmorun.github.io/mote/)
- [mustache](https://github.com/janl/mustache.js)
- [nunjucks](https://github.com/mozilla/nunjucks) [(website)](https://mozilla.github.io/nunjucks)
- [plates](https://github.com/flatiron/plates)
- [pug (formerly jade)](https://github.com/pugjs/pug) [(website)](http://jade-lang.com/)
- [QEJS](https://github.com/jepso/QEJS)
- [ractive](https://github.com/Rich-Harris/Ractive)
- [razor](https://github.com/kinogam/kino.razor)
- [react](https://github.com/facebook/react)
- [slm](https://github.com/slm-lang/slm)
- [squirrelly](https://github.com/nebrelbug/squirrelly) [(website)](https://squirrelly.js.org)
- [swig (maintained fork)](https://github.com/node-swig/swig-templates)
- [swig (unmaintained)](https://github.com/paularmstrong/swig)
- [teacup](https://github.com/goodeggs/teacup)
- [templayed](http://archan937.github.com/templayed.js/)
- [toffee](https://github.com/malgorithms/toffee)
- [twig](https://github.com/justjohn/twig.js)
- [underscore](https://github.com/documentcloud/underscore) [(website)](http://underscorejs.org/#template)
- [vash](https://github.com/kirbysayshi/vash)
- [velocityjs](https://github.com/julianshapiro/velocity) [(website)](http://velocityjs.org/)
- [walrus](https://github.com/jeremyruppel/walrus) [(website)](http://documentup.com/jeremyruppel/walrus/)
- [whiskers](https://github.com/gsf/whiskers.js)

**NOTE**: If you wish to use template engines other than `nunjucks` or `handlebars`, you must install the engines you wish to use: Add them to your package.json dependencies or install globally.
