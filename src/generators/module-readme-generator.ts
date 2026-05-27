import type { DocModule } from "../types/doc-types.ts";
import { generateFunctionSection } from "./function-generator.ts";
import {
  generateInterfaceSection,
  generateTypeAliasSection,
} from "./interface-generator.ts";
import { generateClassSection } from "./class-generator.ts";
import { generateEnumSection } from "./enum-generator.ts";
import { generateConstantSection } from "./constant-generator.ts";
import type {
  DocExport,
  DocFunction,
  DocInterface,
  DocTypeAlias,
  DocClass,
  DocEnum,
  DocConstant,
  TsDocsOptions,
} from "../types/doc-types.ts";

function categorize(exports: DocExport[]): Record<string, DocExport[]> {
  const cats: Record<string, DocExport[]> = {
    function: [],
    interface: [],
    type: [],
    class: [],
    enum: [],
    constant: [],
  };

  for (const exp of exports) {
    const cat = cats[exp.kind] ?? [];
    cat.push(exp);
    cats[exp.kind] = cat;
  }

  return cats;
}

export function generateModuleReadme(
  mod: DocModule,
  order: number,
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push(`id: ${mod.name}`);
  lines.push(`title: ${mod.name}`);
  lines.push(`sidebar_position: ${order}`);
  lines.push("---", "");

  lines.push(`# ${mod.name}`, "");

  if (mod.readme?.jsdoc.summary) {
    lines.push(mod.readme.jsdoc.summary, "");
  }

  const allExports = mod.files.flatMap((f) => f.exports);
  if (allExports.length > 0) {
    lines.push("## Exports", "");
    lines.push("| Name | Kind | Description |");
    lines.push("|------|------|-------------|");
    for (const exp of allExports) {
      lines.push(
        `| \`${exp.name}\` | ${exp.kind} | ${exp.jsdoc?.summary ?? ""} |`,
      );
    }
    lines.push("");
  }

  const cats = categorize(allExports);

  const fns = cats.function as DocFunction[];
  const interfaces = cats.interface as DocInterface[];
  const types = cats.type as DocTypeAlias[];
  const classes = cats.class as DocClass[];
  const enums = cats.enum as DocEnum[];
  const constants = cats.constant as DocConstant[];

  if (fns.length) lines.push(generateFunctionSection(fns, typeLinkMap, opts));
  if (interfaces.length)
    lines.push(generateInterfaceSection(interfaces, typeLinkMap, opts));
  if (types.length)
    lines.push(generateTypeAliasSection(types, typeLinkMap, opts));
  if (classes.length)
    lines.push(generateClassSection(classes, typeLinkMap, opts));
  if (enums.length) lines.push(generateEnumSection(enums, opts));
  if (constants.length) lines.push(generateConstantSection(constants, opts));

  return lines.join("\n");
}

export function generateRootReadme(
  mod: DocModule,
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push(`title: ${mod.name}`);
  lines.push("sidebar_position: 0");
  lines.push("---", "");

  lines.push(`# ${mod.name}`, "");
  lines.push("Auto-generated SDK reference documentation.", "");

  if (mod.files.length > 0) {
    lines.push("## Overview", "");
    const totalExports = mod.files.reduce((s, f) => s + f.exports.length, 0);
    lines.push(
      `This module contains **${totalExports}** exported symbols across **${mod.files.length}** source files.`,
    );
    if (mod.submodules.length > 0) {
      lines.push(`It also contains **${mod.submodules.length}** sub-modules.`);
    }
    lines.push("");
  }

  const allExports = mod.files.flatMap((f) => f.exports);
  if (allExports.length > 0) {
    lines.push("## Exports", "");
    lines.push("| Name | Kind | Description |");
    lines.push("|------|------|-------------|");
    for (const exp of allExports) {
      lines.push(
        `| \`${exp.name}\` | ${exp.kind} | ${exp.jsdoc?.summary ?? ""} |`,
      );
    }
    lines.push("");
  }

  if (mod.submodules.length > 0) {
    lines.push("## Modules", "");
    for (const sub of mod.submodules) {
      lines.push(`- [${sub.name}](./${sub.name}/README.md)`);
    }
    lines.push("");
  }

  const cats = categorize(allExports);

  const fns = cats.function as DocFunction[];
  const interfaces = cats.interface as DocInterface[];
  const types = cats.type as DocTypeAlias[];
  const classes = cats.class as DocClass[];
  const enums = cats.enum as DocEnum[];
  const constants = cats.constant as DocConstant[];

  if (fns.length) lines.push(generateFunctionSection(fns, typeLinkMap, opts));
  if (interfaces.length)
    lines.push(generateInterfaceSection(interfaces, typeLinkMap, opts));
  if (types.length)
    lines.push(generateTypeAliasSection(types, typeLinkMap, opts));
  if (classes.length)
    lines.push(generateClassSection(classes, typeLinkMap, opts));
  if (enums.length) lines.push(generateEnumSection(enums, opts));
  if (constants.length) lines.push(generateConstantSection(constants, opts));

  return lines.join("\n");
}
