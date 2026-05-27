import type {
  DocModule,
  SidebarItem,
  TsDocsOptions,
} from "../types/doc-types.ts";
import type { SidebarAdapter } from "./types.js";

function toVitePressItem(item: SidebarItem): {
  text: string;
  link?: string;
  items?: object[];
} {
  return {
    text: item.label,
    link: item.link?.href,
    items: item.items?.map(toVitePressItem),
  };
}

export class VitePressSidebarAdapter implements SidebarAdapter {
  serialize(
    items: SidebarItem[],
    _mod: DocModule,
    _opts: TsDocsOptions,
  ): string {
    return JSON.stringify(items.map(toVitePressItem), null, 2);
  }

  filename(): string {
    return "sidebar.json";
  }
}
