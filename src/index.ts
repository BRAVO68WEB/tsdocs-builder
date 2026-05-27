import type {
  TsDocsOptions,
  SidebarStyle,
  SortBy,
  GroupBy,
} from "./types/doc-types.ts";
import { TsDocsParser } from "./core/parser.ts";
import {
  generateRootReadme,
  generateModuleReadme,
} from "./generators/module-readme-generator.ts";
import { generateSidebarContent } from "./generators/navigation-generator.ts";
import { docToFileName } from "./output/file-namer.ts";
import { writeMarkdown, buildOutputPath } from "./output/markdown-writer.ts";
import type { DocExport, DocModule, DocFile } from "./types/doc-types.ts";
import { generateFunctionDoc } from "./generators/function-generator.ts";
import {
  generateInterfaceDoc,
  generateTypeAliasDoc,
} from "./generators/interface-generator.ts";
import { generateClassDoc } from "./generators/class-generator.ts";
import { generateEnumDoc } from "./generators/enum-generator.ts";
import { generateConstantDoc } from "./generators/constant-generator.ts";

export function parseCliArgs(args: string[]): TsDocsOptions {
  const inputFlag = args.indexOf("--input");
  const outputFlag = args.indexOf("--output");
  const inputPos = args.indexOf("-i");
  const outputPos = args.indexOf("-o");

  let input = "";
  let output = "";

  if (inputFlag !== -1) input = args[inputFlag + 1] ?? "";
  else if (inputPos !== -1) input = args[inputPos + 1] ?? "";
  else {
    for (let i = 0; i < args.length; i++) {
      if (!args[i].startsWith("-") && i > 0 && !args[i - 1].startsWith("-")) {
        input = args[i];
        break;
      }
      if (args[i] === "--input" || args[i] === "-i") {
        input = args[i + 1] ?? "";
        break;
      }
    }
  }

  if (outputFlag !== -1) output = args[outputFlag + 1] ?? "";
  else if (outputPos !== -1) output = args[outputPos + 1] ?? "";
  else {
    for (let i = 0; i < args.length; i++) {
      if (
        args[i] === "--input" ||
        args[i] === "-i" ||
        args[i] === "--output" ||
        args[i] === "-o"
      ) {
        i++;
        continue;
      }
      if (
        !args[i].startsWith("-") &&
        args[i - 1] &&
        !args[i - 1].startsWith("-")
      ) {
        for (let j = 0; j < i; j++) {
          if (args[j] === "--input" || args[j] === "-i") {
            output = args[i];
            break;
          }
        }
        break;
      }
    }
  }

  if (!input || !output) {
    console.error("Error: --input and --output are required");
    console.error("Usage: tsdocs --input ./src --output ./docs");
    process.exit(1);
  }

  const hasFlag = (flags: string[]) => flags.some((f) => args.includes(f));
  const getFlag = (flags: string[], defaultVal: string) => {
    for (const f of flags) {
      const idx = args.indexOf(f);
      if (idx !== -1) return args[idx + 1] ?? defaultVal;
    }
    return defaultVal;
  };
  const getBoolFlag = (flags: string[], defaultVal: boolean) => {
    const negIdx = args.findIndex((a) =>
      flags.some((f) => a === `no-${f.slice(2)}`),
    );
    if (negIdx !== -1) return false;
    return getFlag(flags, String(defaultVal)) !== "false";
  };

  const getMultiFlag = (flags: string[], defaultVal: string[]) => {
    const v = getFlag(flags, "");
    return v ? v.split(",").map((p) => p.trim()) : defaultVal;
  };

  return {
    input: resolvePath(input),
    output: resolvePath(output),
    baseName: getFlag(["--baseName", "-b"], "") || undefined,
    include: getMultiFlag(["--include"], ["**/*.ts", "**/*.tsx"]),
    exclude: getMultiFlag(
      ["--exclude"],
      ["**/*.d.ts", "**/*.spec.ts", "**/*.test.ts", "**/node_modules/**"],
    ),
    skipPrivate: getBoolFlag(["--skipPrivate"], true),
    skipDeprecated: getBoolFlag(["--skipDeprecated"], false),
    ignoreSources: getBoolFlag(["--ignoreSources"], false),
    skipInternal: getBoolFlag(["--skipInternal"], false),
    sidebar: getBoolFlag(["--sidebar"], true),
    sidebarStyle: getFlag(["--sidebarStyle"], "docusaurus") as SidebarStyle,
    groupBy: getFlag(["--groupBy"], "kind") as GroupBy,
    sortBy: getFlag(["--sortBy"], "alphabetical") as SortBy,
    treatAsSingleModule: hasFlag(["--treatAsSingleModule"]),
    config: getFlag(["--config"], "") || undefined,
  };
}

function resolvePath(p: string): string {
  if (!p) return p;
  if (p.startsWith("/")) return p;
  const cwd = process.cwd();
  return `${cwd}/${p}`.replace(/\/+/g, "/");
}

function buildTypeLinkMap(mod: DocModule): Map<string, string> {
  const map = new Map<string, string>();
  const collect = (files: DocFile[]) => {
    for (const f of files) {
      for (const exp of f.exports) {
        if (
          ["interface", "type", "class", "enum", "constant"].includes(exp.kind)
        ) {
          map.set(exp.name, docToFileName(exp));
        }
      }
    }
  };
  collect(mod.files);
  for (const sub of mod.submodules) collect(sub.files);
  return map;
}

export async function run(opts: TsDocsOptions): Promise<void> {
  console.log(`Parsing TypeScript source: ${opts.input}`);

  const parser = new TsDocsParser(opts);
  const module = parser.parse();
  const typeLinkMap = buildTypeLinkMap(module);

  console.log(
    `Found ${module.files.length} top-level files, ${module.submodules.length} submodules`,
  );
  console.log(
    `Total exports: ${module.files.reduce((s, f) => s + f.exports.length, 0)}`,
  );

  // Write root README
  const rootReadme = generateRootReadme(module, typeLinkMap, opts);
  await writeMarkdown(
    buildOutputPath(opts.output, "", "README.md"),
    rootReadme,
  );
  console.log(`Wrote README.md`);

  // Write individual export docs
  await writeExportDocs(module.files, opts.output, "", typeLinkMap, opts);

  // Write submodule READMEs
  for (let i = 0; i < module.submodules.length; i++) {
    const sub = module.submodules[i];
    const subReadme = generateModuleReadme(sub, i + 1, typeLinkMap, opts);
    const subDir = sub.name;
    await writeMarkdown(
      buildOutputPath(opts.output, subDir, "README.md"),
      subReadme,
    );
    console.log(`Wrote ${sub.name}/README.md`);
    await writeExportDocs(sub.files, opts.output, subDir, typeLinkMap, opts);
  }

  // Write sidebar
  if (opts.sidebar) {
    const sidebarContent = generateSidebarContent(module, opts);
    await writeMarkdown(
      buildOutputPath(opts.output, "", "_sidebar.json"),
      sidebarContent,
    );
    console.log(`Wrote _sidebar.json`);
  }

  console.log(`\nDocumentation generated in: ${opts.output}`);
}

async function writeExportDocs(
  files: DocFile[],
  outputDir: string,
  relPath: string,
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): Promise<void> {
  for (const file of files) {
    for (const exp of file.exports) {
      const content = generateExportDoc(exp, typeLinkMap, opts);
      const fileName = docToFileName(exp);
      const outPath = buildOutputPath(outputDir, relPath, fileName);
      await writeMarkdown(outPath, content);
    }
  }
}

function generateExportDoc(
  exp: DocExport,
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  switch (exp.kind) {
    case "function":
      return generateFunctionDoc(exp, typeLinkMap, opts);
    case "interface":
      return generateInterfaceDoc(exp, typeLinkMap, opts);
    case "type":
      return generateTypeAliasDoc(exp, typeLinkMap, opts);
    case "class":
      return generateClassDoc(exp, typeLinkMap, opts);
    case "enum":
      return generateEnumDoc(exp, opts);
    case "constant":
      return generateConstantDoc(exp, opts);
  }
}

// Run if executed directly
const args = process.argv.slice(2);
if (import.meta.path.includes("index.ts")) {
  const opts = parseCliArgs(args);
  await run(opts);
}
