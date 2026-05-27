import type {
  DocInterface,
  DocTypeAlias,
  TsDocsOptions,
} from "../types/doc-types.ts";
import { linkTypesInText } from "../utils/type-linker.ts";

export function generateInterfaceDoc(
  intr: DocInterface,
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  const lines: string[] = [];

  if (intr.jsdoc.summary) {
    lines.push(intr.jsdoc.summary);
    if (intr.jsdoc.description) lines.push("", intr.jsdoc.description);
  } else if (intr.jsdoc.description) {
    lines.push(intr.jsdoc.description);
  }
  lines.push("");

  lines.push("## Signature", "");
  lines.push("```typescript");
  lines.push(intr.signature);
  lines.push("```", "");

  if (intr.extends && intr.extends.length > 0) {
    const extStr = linkTypesInText(intr.extends.join(", "), typeLinkMap);
    lines.push(`**Extends:** ${extStr}`, "");
  }

  if (intr.members.length > 0) {
    lines.push("### Properties", "");
    lines.push("| Property | Type | Optional | Description |");
    lines.push("|----------|------|:--------:|-------------|");

    for (const member of intr.members) {
      if (member.jsdoc.isIgnore) continue;
      const desc = linkTypesInText(member.jsdoc.summary || "", typeLinkMap);
      const type = linkTypesInText(member.type, typeLinkMap);
      lines.push(
        `| \`${member.name}\` | \`${type}\` | ${member.optional ? "Yes" : "No"} | ${desc} |`,
      );
    }
    lines.push("");
  }

  if (
    !intr.jsdoc.summary &&
    !intr.jsdoc.description &&
    intr.jsdoc.tags.length === 0
  ) {
    lines.push("*No documentation provided.*", "");
  }

  if (intr.jsdoc.deprecated) {
    lines.push("", `**Deprecated:** ${intr.jsdoc.deprecated}`, "");
  }

  if (!opts.ignoreSources) {
    lines.push("", `**Source:** \`${intr.sourceLocation}\``);
  }

  return lines.join("\n");
}

export function generateInterfaceSection(
  interfaces: DocInterface[],
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  if (interfaces.length === 0) return "";

  const lines: string[] = [];
  lines.push("## Interfaces", "");

  for (const intr of interfaces) {
    lines.push(
      `### ${intr.name} {#${intr.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}}`,
      "",
    );
    lines.push(generateInterfaceDoc(intr, typeLinkMap, opts));
    lines.push("");
  }

  return lines.join("\n");
}

export function generateTypeAliasDoc(
  ta: DocTypeAlias,
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  const lines: string[] = [];

  if (ta.jsdoc.summary) {
    lines.push(ta.jsdoc.summary);
    if (ta.jsdoc.description) lines.push("", ta.jsdoc.description);
  } else if (ta.jsdoc.description) {
    lines.push(ta.jsdoc.description);
  }
  lines.push("");

  lines.push("## Signature", "");
  lines.push("```typescript");
  lines.push(ta.signature);
  lines.push("```", "");

  if (
    !ta.jsdoc.summary &&
    !ta.jsdoc.description &&
    ta.jsdoc.tags.length === 0
  ) {
    const rhs = ta.signature.split("=")[1]?.trim().replace(/;$/, "");
    if (rhs) {
      const linked = linkTypesInText(rhs, typeLinkMap);
      lines.push("", `*Type:* \`${linked}\` *(no JSDoc provided)*`);
    }
  }

  if (ta.jsdoc.deprecated) {
    lines.push("", `**Deprecated:** ${ta.jsdoc.deprecated}`, "");
  }

  if (!opts.ignoreSources) {
    lines.push("", `**Source:** \`${ta.sourceLocation}\``);
  }

  return lines.join("\n");
}

export function generateTypeAliasSection(
  aliases: DocTypeAlias[],
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  if (aliases.length === 0) return "";

  const lines: string[] = [];
  lines.push("## Type Aliases", "");

  for (const ta of aliases) {
    lines.push(
      `### ${ta.name} {#${ta.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}}`,
      "",
    );
    lines.push(generateTypeAliasDoc(ta, typeLinkMap, opts));
    lines.push("");
  }

  return lines.join("\n");
}
