import type {
  DocModule,
  SidebarItem,
  TsDocsOptions,
} from "../types/doc-types.ts";

function slugifyName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
}

function kindLabel(kind: string): string {
  switch (kind) {
    case "function":
      return "Functions";
    case "interface":
      return "Interfaces";
    case "type":
      return "Types";
    case "class":
      return "Classes";
    case "enum":
      return "Enums";
    case "constant":
      return "Constants";
    default:
      return kind;
  }
}

function buildSidebar(mod: DocModule, baseName: string): SidebarItem[] {
  const items: SidebarItem[] = [];

  items.push({
    label: "Overview",
    link: { href: `/${baseName}/README.md` },
  });

  const allRootExports = mod.files.flatMap((f) => f.exports);
  const groups: Record<string, { name: string; label: string }[]> = {
    function: [],
    interface: [],
    type: [],
    class: [],
    enum: [],
    constant: [],
  };

  const seenRootNames = new Set<string>();
  for (const exp of allRootExports) {
    if (seenRootNames.has(exp.name)) continue;
    seenRootNames.add(exp.name);
    if (groups[exp.kind]) {
      groups[exp.kind].push({
        name: exp.name,
        label: exp.name,
      });
    }
  }

  for (const [kind, groupItems] of Object.entries(groups)) {
    if (groupItems.length === 0) continue;
    const children: SidebarItem[] = groupItems.map((item) => ({
      label: item.label,
      link: { href: `/${baseName}/${slugifyName(item.name)}.md` },
    }));

    items.push({
      label: kindLabel(kind),
      items: children,
    });
  }

  for (const sub of mod.submodules) {
    const subItems: SidebarItem[] = [];

    const subDir = sub.name;
    subItems.push({
      label: `${sub.name} Overview`,
      link: { href: `/${baseName}/${subDir}/README.md` },
    });

    const subExports = sub.files.flatMap((f) => f.exports);
    const seenSubNames = new Set<string>();
    for (const exp of subExports) {
      if (seenSubNames.has(exp.name)) continue;
      seenSubNames.add(exp.name);
      subItems.push({
        label: exp.name,
        link: { href: `/${baseName}/${subDir}/${slugifyName(exp.name)}.md` },
      });
    }

    items.push({
      label: sub.name,
      items: subItems,
    });
  }

  return items;
}

export function generateSidebar(
  mod: DocModule,
  opts: TsDocsOptions,
): SidebarItem[] {
  return buildSidebar(mod, opts.baseName ?? mod.name);
}

export function sidebarToJson(items: SidebarItem[]): string {
  return JSON.stringify(items, null, 2);
}

export function generateSidebarContent(
  mod: DocModule,
  opts: TsDocsOptions,
): string {
  const items = generateSidebar(mod, opts);
  return sidebarToJson(items);
}
