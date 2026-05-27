import type {
  DocFunction,
  DocParam,
  TsDocsOptions,
} from "../types/doc-types.ts";
import {
  extractParamTags,
  extractReturnsTag,
  extractRemarksTags,
} from "../core/jsdoc-parser.ts";
import { linkTypesInText } from "../utils/type-linker.ts";

export function generateFunctionDoc(
  fn: DocFunction,
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  const lines: string[] = [];
  const jsdoc = fn.jsdoc;
  const paramMap = extractParamTags(jsdoc.tags);

  if (jsdoc.summary) {
    lines.push(jsdoc.summary);
    if (jsdoc.description) lines.push("", jsdoc.description);
  } else if (jsdoc.description) {
    lines.push(jsdoc.description);
  }
  lines.push("");

  lines.push("## Signature", "");
  lines.push("```typescript");
  lines.push(fn.signature);
  lines.push("```", "");

  if (fn.params.length > 0) {
    lines.push("### Parameters", "");
    lines.push("| Parameter | Type | Required | Description |");
    lines.push("|-----------|------|:--------:|-------------|");

    for (const param of fn.params) {
      const tag = paramMap.get(param.name);
      const required = param.optional ? "No" : "Yes";
      const desc = linkTypesInText(tag?.content ?? "", typeLinkMap);
      const rawType = tag?.type ?? param.type;
      const type = linkTypesInText(rawType, typeLinkMap);
      lines.push(`| \`${param.name}\` | \`${type}\` | ${required} | ${desc} |`);
    }
    lines.push("");
  }

  const returnsTag = extractReturnsTag(jsdoc.tags);
  if (fn.returnType) {
    const returnDesc = linkTypesInText(returnsTag?.content ?? "", typeLinkMap);
    const retType = linkTypesInText(fn.returnType, typeLinkMap);
    lines.push("### Returns", "");
    lines.push(`\`${retType}\`${returnDesc ? ` — ${returnDesc}` : ""}`);
    lines.push("");
  }

  const remarks = extractRemarksTags(jsdoc.tags);
  if (remarks.length > 0) {
    lines.push("### Remarks", "");
    for (const r of remarks) {
      lines.push(`- ${linkTypesInText(r, typeLinkMap)}`);
    }
    lines.push("");
  }

  if (jsdoc.examples.length > 0) {
    lines.push("### Example", "");
    for (const example of jsdoc.examples) {
      lines.push("```typescript");
      lines.push(example);
      lines.push("```", "");
    }
  }

  if (!jsdoc.summary && !jsdoc.description && jsdoc.tags.length === 0) {
    lines.push("*No documentation provided.*", "");
  }

  if (jsdoc.deprecated) {
    lines.push("", `**Deprecated:** ${jsdoc.deprecated}`, "");
  }

  if (!opts.ignoreSources) {
    lines.push("", `**Source:** \`${fn.sourceLocation}\``);
  }

  return lines.join("\n");
}

export function generateFunctionSection(
  fns: DocFunction[],
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  if (fns.length === 0) return "";

  const lines: string[] = [];
  lines.push("## Functions", "");

  for (const fn of fns) {
    lines.push(
      `### ${fn.name} {#${fn.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}}`,
      "",
    );
    lines.push(generateFunctionDoc(fn, typeLinkMap, opts));
    lines.push("");
  }

  return lines.join("\n");
}
