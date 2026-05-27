import type {
  DocModule,
  SidebarItem,
  TsDocsOptions,
} from "../types/doc-types.ts";
import type { SidebarAdapter } from "./types.js";

export class NeutrinoSidebarAdapter implements SidebarAdapter {
  serialize(
    items: SidebarItem[],
    _mod: DocModule,
    _opts: TsDocsOptions,
  ): string {
    const flat: { text: string; link: string }[] = [];
    const flatten = (items: SidebarItem[]) => {
      for (const item of items) {
        if (item.link?.href) {
          flat.push({ text: item.label, link: item.link.href });
        }
        if (item.items) flatten(item.items);
      }
    };
    flatten(items);
    return JSON.stringify(flat, null, 2);
  }

  filename(): string {
    return "navigation.json";
  }
}
