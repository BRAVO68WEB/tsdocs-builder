import type { DocExport } from "../types/doc-types.ts";

export function docToFileName(exp: DocExport): string {
  const base = exp.name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();

  // Prevent collisions with README
  if (base === "readme") return `${base}-doc.md`;
  return `${base}.md`;
}

export function moduleToDir(relPath: string): string {
  return relPath ? relPath.replace(/\\/g, "/") : "";
}
