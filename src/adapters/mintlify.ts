import type {
  DocModule,
  SidebarItem,
  TsDocsOptions,
} from "../types/doc-types.ts";
import type { SidebarAdapter } from "./types.js";

function toMintlifyEntry(item: SidebarItem): { title: string; slug: string } {
  return {
    title: item.label,
    slug: item.link?.href?.replace(/^\//, "") ?? "",
  };
}

export class MintlifySidebarAdapter implements SidebarAdapter {
  serialize(
    items: SidebarItem[],
    _mod: DocModule,
    _opts: TsDocsOptions,
  ): string {
    return JSON.stringify(items.map(toMintlifyEntry), null, 2);
  }

  filename(): string {
    return "_meta.json";
  }
}
