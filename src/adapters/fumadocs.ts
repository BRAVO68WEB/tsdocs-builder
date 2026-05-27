import type {
  DocModule,
  SidebarItem,
  TsDocsOptions,
} from "../types/doc-types.ts";
import type { SidebarAdapter } from "./types.js";

function toFumadocsItem(item: SidebarItem): {
  title: string;
  link?: string;
  children?: object[];
} {
  return {
    title: item.label,
    link: item.link?.href,
    children: item.items?.map(toFumadocsItem),
  };
}

export class FumadocsSidebarAdapter implements SidebarAdapter {
  serialize(
    items: SidebarItem[],
    _mod: DocModule,
    _opts: TsDocsOptions,
  ): string {
    return JSON.stringify(items.map(toFumadocsItem), null, 2);
  }

  filename(): string {
    return "sidebar.json";
  }
}
