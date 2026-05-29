import { getSidebarAdapter } from "./adapters/index.ts";
import { TsDocsParser } from "./core/parser.ts";
import { generateClassDoc } from "./generators/class-generator.ts";
import { generateConstantDoc } from "./generators/constant-generator.ts";
import { generateEnumDoc } from "./generators/enum-generator.ts";
import { generateFunctionDoc } from "./generators/function-generator.ts";
import {
  generateInterfaceDoc,
  generateTypeAliasDoc,
} from "./generators/interface-generator.ts";
import {
  generateModuleReadme,
  generateRootReadme,
} from "./generators/module-readme-generator.ts";
import { generateSidebar } from "./generators/navigation-generator.ts";
import { docToFileName } from "./output/file-namer.ts";
import { buildOutputPath, writeMarkdown } from "./output/markdown-writer.ts";
import type {
  DocExport,
  DocFile,
  DocModule,
  GroupBy,
  SidebarStyle,
  SortBy,
  TsDocsOptions,
} from "./types/doc-types.ts";
import { loadConfigFile } from "./utils/config-loader.ts";

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

  const getFlag = (flags: string[], defaultVal: string) => {
    for (const f of flags) {
      const idx = args.indexOf(f);
      if (idx !== -1) {
        const next = args[idx + 1];
        // If no value follows or next arg is another flag, return empty (standalone flag)
        if (!next || next.startsWith("-")) return "";
        return next;
      }
    }
    return defaultVal;
  };
  const getBoolFlag = (flags: string[], defaultVal: boolean) => {
    for (const f of flags) {
      const negIdx = args.indexOf(`--no-${f.slice(2)}`);
      if (negIdx !== -1) return false;
    }
    return getFlag(flags, String(defaultVal)) !== "false";
  };

  const getMultiFlag = (flags: string[], defaultVal: string[]) => {
    const v = getFlag(flags, "");
    return v ? v.split(",").map((p) => p.trim()) : defaultVal;
  };

  // --config support: load from file if provided
  let configDefaults: Partial<TsDocsOptions> = {};
  const configPath = getFlag(["--config"], "");
  if (configPath) {
    try {
      configDefaults = loadConfigFile(configPath);
    } catch (e) {
      console.error(`Error loading config file: ${e}`);
      process.exit(1);
    }
  }

  // Use CLI arg if provided, else config value, else empty
  const effectiveInput =
    input || (configDefaults.input as string | undefined) || "";
  const effectiveOutput =
    output || (configDefaults.output as string | undefined) || "";

  if (!effectiveInput || !effectiveOutput) {
    console.error(
      "Error: --input and --output are required (via CLI or config file)",
    );
    console.error("Usage: tsdocs --input ./src --output ./docs");
    console.error("Or: tsdocs --config ./tsdocs.config.json");
    process.exit(1);
  }

  return {
    input: resolvePath(effectiveInput),
    output: resolvePath(effectiveOutput),
    baseName:
      getFlag(["--baseName", "-b"], "") || configDefaults.baseName || undefined,
    include: getMultiFlag(["--include"], ["**/*.ts", "**/*.tsx"]),
    exclude: getMultiFlag(
      ["--exclude"],
      ["**/*.d.ts", "**/*.spec.ts", "**/*.test.ts", "**/node_modules/**"],
    ),
    skipPrivate: getBoolFlag(
      ["--skipPrivate"],
      configDefaults.skipPrivate ?? true,
    ),
    skipDeprecated: getBoolFlag(
      ["--skipDeprecated"],
      configDefaults.skipDeprecated ?? false,
    ),
    ignoreSources: getBoolFlag(
      ["--ignoreSources"],
      configDefaults.ignoreSources ?? false,
    ),
    skipInternal: getBoolFlag(
      ["--skipInternal"],
      configDefaults.skipInternal ?? false,
    ),
    sidebar: getBoolFlag(["--sidebar"], configDefaults.sidebar ?? true),
    sidebarStyle: getFlag(
      ["--sidebarStyle"],
      (configDefaults.sidebarStyle as SidebarStyle) || "docusaurus",
    ) as SidebarStyle,
    groupBy: getFlag(
      ["--groupBy"],
      (configDefaults.groupBy as GroupBy) || "kind",
    ) as GroupBy,
    sortBy: getFlag(
      ["--sortBy"],
      (configDefaults.sortBy as SortBy) || "alphabetical",
    ) as SortBy,
    treatAsSingleModule: getBoolFlag(
      ["--treatAsSingleModule"],
      configDefaults.treatAsSingleModule ?? false,
    ),
    config: configPath || undefined,
    ignorePaths: getMultiFlag(["--ignorePaths"], []),
    dryrun: getBoolFlag(["--dryrun"], configDefaults.dryrun ?? false),
    showMissingRef: getBoolFlag(
      ["--showMissingRef"],
      configDefaults.showMissingRef ?? false,
    ),
  };
}

function resolvePath(p: string): string {
  if (!p) return p;
  if (p.startsWith("/")) return p;
  const cwd = process.cwd();
  return `${cwd}/${p}`.replace(/\/+/g, "/");
}

function hasJSDoc(jsdoc: any): boolean {
  return !!(jsdoc.summary || jsdoc.description || jsdoc.tags?.length);
}

function buildTypeLinkMap(
  mod: DocModule,
  opts: TsDocsOptions,
): Map<string, string> {
  const map = new Map<string, string>();
  const collect = (files: DocFile[]) => {
    for (const f of files) {
      for (const exp of f.exports) {
        if (
          ["interface", "type", "class", "enum", "constant"].includes(exp.kind)
        ) {
          if (opts.skipInternal && (exp as any).jsdoc?.isInternal) continue;
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
  const typeLinkMap = buildTypeLinkMap(module, opts);

  console.log(
    `Found ${module.files.length} top-level files, ${module.submodules.length} submodules`,
  );
  console.log(
    `Total exports: ${module.files.reduce((s, f) => s + f.exports.length, 0)}`,
  );

  if (opts.dryrun) {
    console.log("\n=== DRY RUN ===\n");
    console.log(`Root: ${module.files.length} files`);
    for (const f of module.files) {
      for (const exp of f.exports) {
        const badge = (exp as any).jsdoc?.isInternal
          ? " [internal]"
          : (exp as any).jsdoc?.isIgnore
            ? " [ignore]"
            : "";
        console.log(` ${(exp.kind as string).padEnd(10)} ${exp.name}${badge}`);
      }
    }
    console.log(`\nSubmodules: ${module.submodules.length}`);
    for (const sub of module.submodules) {
      console.log(` ${sub.name}/ (${sub.files.length} files)`);
      for (const f of sub.files) {
        for (const exp of f.exports) {
          const badge = (exp as any).jsdoc?.isInternal
            ? " [internal]"
            : (exp as any).jsdoc?.isIgnore
              ? " [ignore]"
              : "";
          console.log(
            ` ${(exp.kind as string).padEnd(10)} ${exp.name}${badge}`,
          );
        }
      }
    }
    console.log("\nOutput structure:");
    console.log(` ${opts.output}/`);
    console.log(` README.md`);
    for (const sub of module.submodules) {
      console.log(` ${sub.name}/`);
      console.log(` README.md`);
      for (const f of sub.files) {
        for (const exp of f.exports) {
          console.log(` ${docToFileName(exp)}`);
        }
      }
    }
    console.log("\n=== DRY RUN (no files written) ===");
    return;
  }

  // Track missing docs if showMissingRef is enabled
  const missingRefs: string[] = [];
  const trackMissing = (exp: DocExport) => {
    if (opts.showMissingRef && !hasJSDoc(exp.jsdoc)) {
      missingRefs.push(`${exp.kind}: ${exp.name}`);
    }
  };

  // Write root README
  const rootReadme = generateRootReadme(module, typeLinkMap, opts);
  await writeMarkdown(
    buildOutputPath(opts.output, "", "README.md"),
    rootReadme,
  );
  console.log("Wrote README.md");

  // Write individual export docs
  await writeExportDocs(
    module.files,
    opts.output,
    "",
    typeLinkMap,
    opts,
    trackMissing,
  );

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
    await writeExportDocs(
      sub.files,
      opts.output,
      subDir,
      typeLinkMap,
      opts,
      trackMissing,
    );
  }

  // Write sidebar
  if (opts.sidebar) {
    const adapter = getSidebarAdapter(opts.sidebarStyle);
    const sidebarContent = adapter.serialize(
      generateSidebar(module, opts),
      module,
      opts,
    );
    await writeMarkdown(
      buildOutputPath(opts.output, "", adapter.filename()),
      sidebarContent,
    );
    console.log(`Wrote ${adapter.filename()}`);
  }

  // Report missing documentation refs
  if (opts.showMissingRef && missingRefs.length > 0) {
    console.warn(
      `\n⚠️ ${missingRefs.length} export(s) missing JSDoc documentation:`,
    );
    for (const ref of missingRefs) {
      console.warn(` - ${ref}`);
    }
    console.warn("");
  }

  console.log(`\nDocumentation generated in: ${opts.output}`);
}

async function writeExportDocs(
  files: DocFile[],
  outputDir: string,
  relPath: string,
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
  onExport?: (exp: DocExport) => void,
): Promise<void> {
  for (const file of files) {
    for (const exp of file.exports) {
      const content = generateExportDoc(exp, typeLinkMap, opts);
      const fileName = docToFileName(exp);
      const outPath = buildOutputPath(outputDir, relPath, fileName);
      await writeMarkdown(outPath, content);
      if (onExport) onExport(exp);
    }
  }
}

export function generateExportDoc(
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

// Public API exports
export { TsDocsParser } from "./core/parser.ts";
export type { DocExport, DocModule, TsDocsOptions } from "./types/doc-types.ts";

export async function generateDocs(opts: TsDocsOptions): Promise<DocModule> {
  const parser = new TsDocsParser(opts);
  const module = parser.parse();
  await run(opts);
  return module;
}
