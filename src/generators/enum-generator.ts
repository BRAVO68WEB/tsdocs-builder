import type { DocEnum, TsDocsOptions } from "../types/doc-types.ts";

export function generateEnumDoc(enu: DocEnum, opts: TsDocsOptions): string {
  const lines: string[] = [];

  if (enu.jsdoc.summary) {
    lines.push(enu.jsdoc.summary);
    if (enu.jsdoc.description) lines.push("", enu.jsdoc.description);
  } else if (enu.jsdoc.description) {
    lines.push(enu.jsdoc.description);
  }
  lines.push("");

  lines.push("## Members", "");
  lines.push("| Member | Value | Description |");
  lines.push("|--------|-------|-------------|");

  for (const member of enu.members) {
    const desc = member.jsdoc.summary ?? "";
    const val = member.value !== undefined ? String(member.value) : "";
    lines.push(`| \`${member.name}\` | \`${val}\` | ${desc} |`);
  }
  lines.push("");

  if (enu.isConst) {
    lines.push("*This is a const enum.*", "");
  }

  if (
    !enu.jsdoc.summary &&
    !enu.jsdoc.description &&
    enu.jsdoc.tags.length === 0
  ) {
    lines.push("*No documentation provided.*", "");
  }

  if (enu.jsdoc.deprecated) {
    lines.push("", `**Deprecated:** ${enu.jsdoc.deprecated}`, "");
  }

  if (!opts.ignoreSources) {
    lines.push("", `**Source:** \`${enu.sourceLocation}\``);
  }

  return lines.join("\n");
}

export function generateEnumSection(
  enums: DocEnum[],
  opts: TsDocsOptions,
): string {
  if (enums.length === 0) return "";

  const lines: string[] = [];
  lines.push("## Enums", "");

  for (const enu of enums) {
    lines.push(
      `### ${enu.name} {#${enu.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}}`,
      "",
    );
    lines.push(generateEnumDoc(enu, opts));
    lines.push("");
  }

  return lines.join("\n");
}
