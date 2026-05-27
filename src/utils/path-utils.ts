export function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stripIndent(text: string): string {
  const lines = text.split("\n");
  const minIndent = lines
    .filter((l) => l.trim())
    .map((l) => l.match(/^(\s*)/)?.[1].length ?? 0)
    .reduce((min, len) => Math.min(min, len), Infinity);

  if (!isFinite(minIndent)) return text.trim();

  return lines
    .map((l) => l.slice(minIndent))
    .join("\n")
    .trim();
}
