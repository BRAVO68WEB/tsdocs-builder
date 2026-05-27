import type { DocConstant, TsDocsOptions } from "../types/doc-types.ts";

export function generateConstantDoc(
  cnst: DocConstant,
  opts: TsDocsOptions,
): string {
  const lines: string[] = [];

  if (cnst.jsdoc.summary) {
    lines.push(cnst.jsdoc.summary);
    if (cnst.jsdoc.description) lines.push("", cnst.jsdoc.description);
  } else if (cnst.jsdoc.description) {
    lines.push(cnst.jsdoc.description);
  }
  lines.push("");

  lines.push("## Signature", "");
  lines.push("```typescript");
  lines.push(cnst.signature);
  lines.push("```", "");

  if (
    !cnst.jsdoc.summary &&
    !cnst.jsdoc.description &&
    cnst.jsdoc.tags.length === 0
  ) {
    lines.push("*No documentation provided.*", "");
  }

  if (cnst.jsdoc.deprecated) {
    lines.push("", `**Deprecated:** ${cnst.jsdoc.deprecated}`, "");
  }

  if (!opts.ignoreSources) {
    lines.push("", `**Source:** \`${cnst.sourceLocation}\``);
  }

  return lines.join("\n");
}

export function generateConstantSection(
  constants: DocConstant[],
  opts: TsDocsOptions,
): string {
  if (constants.length === 0) return "";

  const lines: string[] = [];
  lines.push("## Constants", "");

  for (const cnst of constants) {
    lines.push(
      `### ${cnst.name} {#${cnst.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}}`,
      "",
    );
    lines.push(generateConstantDoc(cnst, opts));
    lines.push("");
  }

  return lines.join("\n");
}
