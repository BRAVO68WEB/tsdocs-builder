import { describe, expect, it } from "vitest";
import {
  escapeMarkdown,
  slugify,
  stripIndent,
} from "../../src/utils/path-utils.ts";

describe("escapeMarkdown", () => {
  it("escapes backslashes", () => {
    expect(escapeMarkdown("a\\b")).toBe("a\\\\b");
  });

  it("escapes square brackets", () => {
    expect(escapeMarkdown("[text]")).toBe("\\[text\\]");
  });

  it("escapes angle brackets", () => {
    expect(escapeMarkdown("<Type>")).toBe("&lt;Type&gt;");
  });

  it("escapes mixed special chars", () => {
    expect(escapeMarkdown("[a]<b>")).toBe("\\[a\\]&lt;b&gt;");
  });
});

describe("slugify", () => {
  it("lowercases and strips non-alphanumeric", () => {
    expect(slugify("HelloWorld")).toBe("helloworld");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("strips non-alphanumeric chars except hyphens", () => {
    expect(slugify("foo@bar#baz")).toBe("foo-bar-baz");
  });

  it("removes leading/trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("foo--bar--baz")).toBe("foo-bar-baz");
  });
});

describe("stripIndent", () => {
  it("strips common indent from multiline string", () => {
    const input = ` line one
 line two
 line three`;
    expect(stripIndent(input)).toBe("line one\nline two\nline three");
  });

  it("returns trimmed single line as-is", () => {
    expect(stripIndent("no indent")).toBe("no indent");
  });

  it("handles empty lines in the middle", () => {
    const input = ` foo

 bar`;
    expect(stripIndent(input)).toBe("foo\n\nbar");
  });

  it("returns empty string for blank input", () => {
    expect(stripIndent(" ")).toBe("");
  });
});
