import type { DocClass, TsDocsOptions } from "../types/doc-types.ts";
import { linkTypesInText } from "../utils/type-linker.ts";

export function generateClassDoc(
  cls: DocClass,
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  const lines: string[] = [];

  if (cls.jsdoc.summary) {
    lines.push(cls.jsdoc.summary);
    if (cls.jsdoc.description) lines.push("", cls.jsdoc.description);
  } else if (cls.jsdoc.description) {
    lines.push(cls.jsdoc.description);
  }
  lines.push("");

  lines.push("## Signature", "");
  lines.push("```typescript");
  lines.push(cls.signature);
  lines.push("```", "");

  const parts: string[] = [];
  if (cls.extends) {
    parts.push(`extends ${linkTypesInText(cls.extends, typeLinkMap)}`);
  }
  if (cls.implements?.length) {
    const implStr = cls.implements
      .map((i) => linkTypesInText(i, typeLinkMap))
      .join(", ");
    parts.push(`implements ${implStr}`);
  }
  if (parts.length) lines.push(parts.join(" | "), "");

  if (cls.constructors.length > 0) {
    lines.push("### Constructor {#constructor}", "");
    for (const ctor of cls.constructors) {
      if (ctor.parameters.length > 0) {
        lines.push("| Parameter | Type | Required | Description |");
        lines.push("|-----------|------|:--------:|-------------|");
        for (const p of ctor.parameters) {
          const type = linkTypesInText(p.type, typeLinkMap);
          lines.push(
            `| \`${p.name}\` | \`${type}\` | ${p.optional ? "No" : "Yes"} | |`,
          );
        }
      }
    }
    lines.push("");
  }

  if (cls.properties.length > 0) {
    const visibleProps = cls.properties.filter((p) => !p.jsdoc.isIgnore);
    if (visibleProps.length > 0) {
      lines.push("### Properties", "");
      lines.push("| Property | Type | Description |");
      lines.push("|----------|------|-------------|");
      for (const prop of visibleProps) {
        const desc = linkTypesInText(prop.jsdoc.summary ?? "", typeLinkMap);
        const type = linkTypesInText(prop.type, typeLinkMap);
        lines.push(`| \`${prop.name}\` | \`${type}\` | ${desc} |`);
      }
      lines.push("");
    }
  }

  if (cls.methods.length > 0) {
    const visibleMethods = cls.methods.filter((m) => !m.jsdoc.isIgnore);
    if (visibleMethods.length > 0) {
      lines.push("### Methods", "");
      for (const method of visibleMethods) {
        const anchor =
          method.anchorId ??
          method.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        lines.push(`#### ${method.name} {#${anchor}}`, "");
        lines.push("```typescript");
        lines.push(method.signature);
        lines.push("```");
        if (method.jsdoc.summary) {
          lines.push(linkTypesInText(method.jsdoc.summary, typeLinkMap));
        }
        lines.push("");
      }
    }
  }

  if (
    !cls.jsdoc.summary &&
    !cls.jsdoc.description &&
    cls.jsdoc.tags.length === 0
  ) {
    lines.push("*No documentation provided.*", "");
  }

  if (cls.jsdoc.deprecated) {
    lines.push("", `**Deprecated:** ${cls.jsdoc.deprecated}`, "");
  }

  if (!opts.ignoreSources) {
    lines.push("", `**Source:** \`${cls.sourceLocation}\``);
  }

  return lines.join("\n");
}

export function generateClassSection(
  classes: DocClass[],
  typeLinkMap: Map<string, string>,
  opts: TsDocsOptions,
): string {
  if (classes.length === 0) return "";

  const lines: string[] = [];
  lines.push("## Classes", "");

  for (const cls of classes) {
    lines.push(
      `### ${cls.name} {#${cls.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}}`,
      "",
    );
    lines.push(generateClassDoc(cls, typeLinkMap, opts));
    lines.push("");
  }

  return lines.join("\n");
}
