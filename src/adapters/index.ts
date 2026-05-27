import { DocusaurusSidebarAdapter } from "./docusaurus.js";
import { FumadocsSidebarAdapter } from "./fumadocs.js";
import { MintlifySidebarAdapter } from "./mintlify.js";
import { NeutrinoSidebarAdapter } from "./neutrino.js";
import type { SidebarAdapter, SidebarStyle } from "./types.js";
import { VitePressSidebarAdapter } from "./vitepress.js";

const adapters: Record<SidebarStyle, SidebarAdapter> = {
  docusaurus: new DocusaurusSidebarAdapter(),
  mintlify: new MintlifySidebarAdapter(),
  fumadocs: new FumadocsSidebarAdapter(),
  vitepress: new VitePressSidebarAdapter(),
  neutrino: new NeutrinoSidebarAdapter(),
};

export function getSidebarAdapter(style: SidebarStyle): SidebarAdapter {
  return adapters[style];
}

export type { SidebarAdapter, SidebarStyle } from "./types.js";
