import type {
  DocModule,
  SidebarItem,
  TsDocsOptions,
} from "../types/doc-types.ts";

export type SidebarStyle =
  | "docusaurus"
  | "mintlify"
  | "fumadocs"
  | "vitepress"
  | "neutrino";

export interface SidebarAdapter {
  serialize(items: SidebarItem[], mod: DocModule, opts: TsDocsOptions): string;
  filename(): string;
}
