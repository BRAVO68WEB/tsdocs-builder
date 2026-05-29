import { readFileSync } from "fs";
import type { TsDocsOptions } from "../types/doc-types.ts";

export function loadConfigFile(path: string): Partial<TsDocsOptions> {
  try {
    const raw = readFileSync(path, "utf8").trim();
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const validKeys: (keyof TsDocsOptions)[] = [
      "input",
      "output",
      "baseName",
      "include",
      "exclude",
      "skipPrivate",
      "skipDeprecated",
      "ignoreSources",
      "skipInternal",
      "sidebar",
      "sidebarStyle",
      "groupBy",
      "sortBy",
      "treatAsSingleModule",
      "ignorePaths",
      "dryrun",
      "showMissingRef",
    ];
    const result: Partial<TsDocsOptions> = {};
    for (const key of validKeys) {
      if (key in parsed) {
        (result as any)[key] = parsed[key];
      }
    }
    return result;
  } catch (e) {
    throw new Error(`Failed to load config from ${path}: ${e}`);
  }
}
