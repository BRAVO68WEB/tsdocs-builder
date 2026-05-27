# tsdocs-builder

![Build](https://img.shields.io/github/actions/workflow/status/Bravo68Web/tsdocs-builder/ci.yml?branch=main)
![npm version](https://img.shields.io/npm/v/tsdocs-builder)
![License](https://img.shields.io/github/license/Bravo68Web/tsdocs-builder)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)

Generate beautiful Markdown documentation from TypeScript source code — with zero configuration.

tsdocs-builder parses your TypeScript files using [ts-morph](https://github.com/dsherret/ts-morph), extracts JSDoc comments, and emits clean Markdown docs with a ready-to-use sidebar for your documentation framework.

---

## Features

- **TypeScript-first** — Understands interfaces, types, classes, enums, functions, and constants
- **JSDoc extraction** — Pulls summaries, descriptions, `@param`, `@returns`, `@example`, `@deprecated`, and custom tags
- **Multi-framework sidebar** — Generates sidebar config for Docusaurus, Mintlify, Fumadocs, VitePress, or Neutrino
- **Type linking** — Automatically links types across your codebase
- **Module grouping** — Organizes exports by file and submodule directory
- **CLI or library** — Use it as a command-line tool or import it as a TypeScript module
- **Bun-native** — Built for Bun, works with Node 18+

---

## Quick Start

```bash
# Install
npm install -g tsdocs-builder
# or: bun add -g tsdocs-builder

# Run
tsdocs --input ./src --output ./docs
```

That's it. Your documentation is in `./docs`.

---

## Installation

### npm (global)

```bash
npm install -g tsdocs-builder
```

### npm (local)

```bash
npm install tsdocs-builder
npx tsdocs --input ./src --output ./docs
```

### Bun

```bash
bun add tsdocs-builder
bun run tsdocs --input ./src --output ./docs
```

### From source

```bash
git clone https://github.com/Bravo68Web/tsdocs-builder.git
cd tsdocs-builder
bun install
bun run build
./bin/tsdocs --input ./src --output ./docs
```

---

## Usage

```bash
tsdocs --input ./src --output ./docs [options]
```

### Basic examples

```bash
# Default: Docusaurus sidebar
tsdocs --input ./src --output ./docs

# Short flags
tsdocs -i ./src -o ./docs

# Positional arguments (input first, output second)
tsdocs ./src ./docs

# Mintlify sidebar
tsdocs --input ./src --output ./docs --sidebarStyle mintlify

# Skip private members
tsdocs --input ./src --output ./docs --skipPrivate
```

---

## CLI Options

| Flag                        | Short | Default                                                           | Description                                                                  |
| --------------------------- | ----- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `--input <path>`            | `-i`  | —                                                                 | **Required.** Path to TypeScript source files                                |
| `--output <path>`           | `-o`  | —                                                                 | **Required.** Output directory for docs                                      |
| `--baseName <name>`         | `-b`  | Module name                                                       | Base path prefix in sidebar links                                            |
| `--include <glob>[,<glob>]` | —     | `**/*.ts`, `**/*.tsx`                                             | File patterns to include                                                     |
| `--exclude <glob>[,<glob>]` | —     | `**/*.d.ts`, `**/*.spec.ts`, `**/*.test.ts`, `**/node_modules/**` | File patterns to exclude                                                     |
| `--skipPrivate`             | —     | `true`                                                            | Omit private (`#`) members from docs                                         |
| `--no-skipPrivate`          | —     | —                                                                 | Include private members                                                      |
| `--skipDeprecated`          | —     | `false`                                                           | Omit `@deprecated` members                                                   |
| `--skipInternal`            | —     | `false`                                                           | Omit `@internal` members                                                     |
| `--ignoreSources`           | —     | `false`                                                           | Skip source location links                                                   |
| `--sidebar`                 | —     | `true`                                                            | Generate sidebar config file                                                 |
| `--no-sidebar`              | —     | —                                                                 | Skip sidebar generation                                                      |
| `--sidebarStyle <style>`    | —     | `docusaurus`                                                      | Sidebar style: `docusaurus`, `mintlify`, `fumadocs`, `vitepress`, `neutrino` |
| `--groupBy <mode>`          | —     | `kind`                                                            | Group exports by: `kind`, `folder`                                           |
| `--sortBy <mode>`           | —     | `alphabetical`                                                    | Sort by: `alphabetical`, `source`, `category`                                |
| `--treatAsSingleModule`     | —     | `false`                                                           | Do not create subdirectory per folder                                        |
| `--config <path>`           | —     | —                                                                 | Path to options JSON file                                                    |
| `--help`                    | `-h`  | —                                                                 | Show help                                                                    |
| `--version`                 | `-V`  | —                                                                 | Show version                                                                 |

---

## Supported Doc Frameworks

| Framework      | Sidebar File      | Notes                                        |
| -------------- | ----------------- | -------------------------------------------- |
| **Docusaurus** | `_sidebar.json`   | Default. Nested `{ label, items }` structure |
| **Mintlify**   | `_meta.json`      | Per-directory. `{ title, slug }` entries     |
| **Fumadocs**   | `sidebar.json`    | MDX-safe. `{ title, link, children }`        |
| **VitePress**  | `sidebar.json`    | Flat. `{ text, link, items }`                |
| **Neutrino**   | `navigation.json` | Flattened `{ text, link }` array             |

### Example: Mintlify

```bash
tsdocs --input ./src --output ./docs --sidebarStyle mintlify
```

Outputs:

```
docs/
├── _meta.json # Root metadata
├── README.md
├── function.md
├── interface.md
├── ...
└── submodule-name/
 ├── _meta.json # Per-directory metadata
 ├── README.md
 └── ...
```

---

## Programmatic API

```typescript
import { TsDocsParser, generateDocs } from "tsdocs-builder";
import type { TsDocsOptions, DocModule } from "tsdocs-builder";

// Low-level: parse and get the DocModule
const opts: TsDocsOptions = {
  input: "./src",
  output: "./docs",
  skipPrivate: true,
  sidebarStyle: "docusaurus",
};

const parser = new TsDocsParser(opts);
const module = parser.parse();

// High-level: parse and write all docs
const module = await generateDocs(opts);
```

---

## Architecture

```
src/
├── index.ts # CLI entry + public API
├── core/
│ ├── parser.ts # Orchestrates parsing pipeline
│ ├── extractor.ts # Extracts exports from ts-morph
│ └── jsdoc-parser.ts # Parses JSDoc blocks
├── generators/ # Markdown generators per export kind
│ ├── function-generator.ts
│ ├── interface-generator.ts
│ ├── class-generator.ts
│ ├── enum-generator.ts
│ ├── constant-generator.ts
│ ├── module-readme-generator.ts
│ └── navigation-generator.ts
├── adapters/ # Sidebar format adapters
│ ├── types.ts
│ ├── docusaurus.ts
│ ├── mintlify.ts
│ ├── fumadocs.ts
│ ├── vitepress.ts
│ └── neutrino.ts
├── output/
│ ├── markdown-writer.ts
│ └── file-namer.ts
├── types/
│ └── doc-types.ts # Core document types
└── utils/
 └── path-utils.ts
```

**Parsing flow:** `index.ts` → `TsDocsParser` → `extractor.ts` → JSDoc parsed per-export → Markdown generated per kind → sidebar serialized per adapter.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

License via [MIT Licence](./LICENSE)
