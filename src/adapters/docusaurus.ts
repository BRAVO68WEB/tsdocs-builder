import type {
  DocModule,
  SidebarItem,
  TsDocsOptions,
} from "../types/doc-types.ts";
import type { SidebarAdapter } from "./types.js";

export class DocusaurusSidebarAdapter implements SidebarAdapter {
  serialize(
    items: SidebarItem[],
    _mod: DocModule,
    _opts: TsDocsOptions,
  ): string {
    return JSON.stringify(items, null, 2);
  }

  filename(): string {
    return "_sidebar.json";
  }
}
