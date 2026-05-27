import { describe, expect, it } from "vitest";
import type { SidebarItem } from "../types/doc-types.ts";
import { DocusaurusSidebarAdapter } from "./docusaurus.ts";
import { FumadocsSidebarAdapter } from "./fumadocs.ts";
import { MintlifySidebarAdapter } from "./mintlify.ts";
import { NeutrinoSidebarAdapter } from "./neutrino.ts";
import { VitePressSidebarAdapter } from "./vitepress.ts";

const makeItems = (): SidebarItem[] => [
  {
    label: "Overview",
    link: { href: "/my-lib/README.md" },
  },
  {
    label: "Interfaces",
    items: [
      {
        label: "MyInterface",
        link: { href: "/my-lib/my-interface.md" },
      },
    ],
  },
];

describe("DocusaurusSidebarAdapter", () => {
  const adapter = new DocusaurusSidebarAdapter();

  it("returns filename _sidebar.json", () => {
    expect(adapter.filename()).toBe("_sidebar.json");
  });

  it("serializes items as raw JSON", () => {
    const result = adapter.serialize(makeItems(), {} as never, {} as never);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].label).toBe("Overview");
    expect(parsed[1].items).toHaveLength(1);
  });

  it("preserves nested items", () => {
    const items: SidebarItem[] = [
      {
        label: "Group",
        items: [
          { label: "A", link: { href: "/a.md" } },
          { label: "B", link: { href: "/b.md" } },
        ],
      },
    ];
    const result = JSON.parse(
      adapter.serialize(items, {} as never, {} as never),
    );
    expect(result[0].items).toHaveLength(2);
  });
});

describe("FumadocsSidebarAdapter", () => {
  const adapter = new FumadocsSidebarAdapter();

  it("returns filename sidebar.json", () => {
    expect(adapter.filename()).toBe("sidebar.json");
  });

  it("maps label to title", () => {
    const result = JSON.parse(
      adapter.serialize(makeItems(), {} as never, {} as never),
    );
    expect(result[0].title).toBe("Overview");
    expect(result[1].title).toBe("Interfaces");
  });

  it("maps link.href to link", () => {
    const items: SidebarItem[] = [
      { label: "Page", link: { href: "/docs/page.md" } },
    ];
    const result = JSON.parse(
      adapter.serialize(items, {} as never, {} as never),
    );
    expect(result[0].link).toBe("/docs/page.md");
  });

  it("maps items to children", () => {
    const items: SidebarItem[] = [
      {
        label: "Group",
        items: [{ label: "Child", link: { href: "/child.md" } }],
      },
    ];
    const result = JSON.parse(
      adapter.serialize(items, {} as never, {} as never),
    );
    expect(result[0].children[0].title).toBe("Child");
  });
});

describe("MintlifySidebarAdapter", () => {
  const adapter = new MintlifySidebarAdapter();

  it("returns filename _meta.json", () => {
    expect(adapter.filename()).toBe("_meta.json");
  });

  it("maps label to title", () => {
    const result = JSON.parse(
      adapter.serialize(makeItems(), {} as never, {} as never),
    );
    expect(result[0].title).toBe("Overview");
  });

  it("strips leading slash from href to form slug", () => {
    const items: SidebarItem[] = [
      { label: "Page", link: { href: "/docs/page.md" } },
    ];
    const result = JSON.parse(
      adapter.serialize(items, {} as never, {} as never),
    );
    expect(result[0].slug).toBe("docs/page.md");
  });

  it("handles items without link", () => {
    const items: SidebarItem[] = [
      { label: "Group", items: [{ label: "Child" }] },
    ];
    const result = JSON.parse(
      adapter.serialize(items, {} as never, {} as never),
    );
    expect(result[0].slug).toBe("");
  });
});

describe("VitePressSidebarAdapter", () => {
  const adapter = new VitePressSidebarAdapter();

  it("returns filename sidebar.json", () => {
    expect(adapter.filename()).toBe("sidebar.json");
  });

  it("maps label to text", () => {
    const result = JSON.parse(
      adapter.serialize(makeItems(), {} as never, {} as never),
    );
    expect(result[0].text).toBe("Overview");
  });

  it("maps link.href to link", () => {
    const items: SidebarItem[] = [
      { label: "Page", link: { href: "/page.md" } },
    ];
    const result = JSON.parse(
      adapter.serialize(items, {} as never, {} as never),
    );
    expect(result[0].link).toBe("/page.md");
  });

  it("maps items to items recursively", () => {
    const items: SidebarItem[] = [
      {
        label: "Group",
        items: [{ label: "Child", link: { href: "/child.md" } }],
      },
    ];
    const result = JSON.parse(
      adapter.serialize(items, {} as never, {} as never),
    );
    expect(result[0].items[0].text).toBe("Child");
  });
});

describe("NeutrinoSidebarAdapter", () => {
  const adapter = new NeutrinoSidebarAdapter();

  it("returns filename navigation.json", () => {
    expect(adapter.filename()).toBe("navigation.json");
  });

  it("flattens nested items into a flat array", () => {
    const items: SidebarItem[] = [
      {
        label: "Overview",
        link: { href: "/README.md" },
      },
      {
        label: "Group",
        items: [
          { label: "A", link: { href: "/a.md" } },
          { label: "B", link: { href: "/b.md" } },
        ],
      },
    ];
    const result = JSON.parse(
      adapter.serialize(items, {} as never, {} as never),
    );
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe("Overview");
    expect(result[1].text).toBe("A");
    expect(result[2].text).toBe("B");
  });

  it("skips items without links", () => {
    const items: SidebarItem[] = [
      { label: "Group", items: [{ label: "NoLink" }] },
    ];
    const result = JSON.parse(
      adapter.serialize(items, {} as never, {} as never),
    );
    expect(result).toHaveLength(0);
  });
});
