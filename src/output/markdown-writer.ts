import { mkdir, readFile, writeFile } from "fs/promises";
export async function ensureDir(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch {
    // Will be created by write
  }
  const parts = path.replace(/\\/g, "/").split("/");
  for (let i = 1; i <= parts.length; i++) {
    const partial = parts.slice(0, i).join("/");
    if (partial) {
      try {
        await mkdir(`${partial}/.keep`, { recursive: true }).catch(() => {});
      } catch {}
    }
  }
}

export async function writeMarkdown(
  outputPath: string,
  content: string,
): Promise<void> {
  const dir = outputPath.replace(/[/][^/]+$/, "");
  if (dir) {
    try {
      await mkdir(`${dir}/.keep`, { recursive: true }).catch(() => {});
    } catch {}
  }
  await writeFile(outputPath, content, "utf8");
}

export async function writeIfChanged(
  outputPath: string,
  content: string,
): Promise<boolean> {
  try {
    const existing = await readFile(outputPath, "utf8").catch(() => "");
    if (existing === content) return false;
  } catch {}
  await writeMarkdown(outputPath, content);
  return true;
}

export function buildOutputPath(
  outputDir: string,
  moduleRelPath: string,
  fileName: string,
): string {
  const parts = [outputDir];
  if (moduleRelPath) parts.push(moduleRelPath);
  parts.push(fileName);
  return parts.join("/").replace(/\/+/g, "/");
}
