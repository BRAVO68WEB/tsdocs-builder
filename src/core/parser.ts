import { resolve as resolvePath } from "node:path";
import { Project, type SourceFile } from "ts-morph";
import type {
  DocExport,
  DocFile,
  DocModule,
  JSDocBlock,
  TsDocsOptions,
} from "../types/doc-types.ts";
import { extractDeclaration } from "./extractor.ts";

export class TsDocsParser {
  private project: Project;
  private options: TsDocsOptions;

  constructor(options: TsDocsOptions) {
    this.options = { ...options, input: resolvePath(options.input) };

    this.project = new Project({
      compilerOptions: {
        target: 5,
        moduleResolution: 2,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
      },
      skipAddingFilesFromTsConfig: true,
    });

    for (const pattern of this.options.include ?? ["**/*.ts"]) {
      this.project.addSourceFilesAtPaths(`${this.options.input}/${pattern}`);
    }
  }

  parse(): DocModule {
    let sourceFiles = this.project.getSourceFiles();
    sourceFiles = sourceFiles.filter((sf) => !this.shouldExclude(sf));

    const baseName = this.options.baseName ?? this.inferBaseName();

    const docModule: DocModule = {
      name: baseName,
      relativePath: "",
      files: [],
      submodules: [],
    };

    const filesByDir = this.groupByDirectory(sourceFiles);

    for (const [dir, files] of Object.entries(filesByDir)) {
      const relPath = this.relativePath(dir);
      if (relPath === "") {
        for (const sf of files) {
          docModule.files.push(this.parseSourceFile(sf));
        }
      } else {
        const submodule = this.parseSubmodule(relPath, files);
        if (submodule) docModule.submodules.push(submodule);
      }
    }

    return docModule;
  }

  private shouldExclude(sf: SourceFile): boolean {
    const filePath = sf.getFilePath().replace(/\\/g, "/");
    for (const pattern of this.options.exclude ?? []) {
      if (this.matchGlob(filePath, pattern)) return true;
    }
    return false;
  }

  private matchGlob(path: string, pattern: string): boolean {
    const pathParts = path.split("/");
    const patternParts = pattern.replace(/\\/g, "/").split("/");
    return this.matchParts(patternParts, pathParts);
  }

  private matchParts(patternParts: string[], pathParts: string[]): boolean {
    let pi = 0;
    let pp = 0;

    while (pi < patternParts.length && pp < pathParts.length) {
      const p = patternParts[pi];

      if (p === "**") {
        if (pi === patternParts.length - 1) return true;
        while (pp < pathParts.length) {
          if (this.matchParts(patternParts.slice(pi + 1), pathParts.slice(pp)))
            return true;
          pp++;
        }
        return false;
      }

      if (p === "*") {
        if (pathParts[pp]?.includes("/")) return false;
      } else if (p.startsWith("*.")) {
        const ext = p.slice(1);
        if (!pathParts[pp]?.endsWith(ext)) return false;
      } else {
        if (pathParts[pp] !== p) return false;
      }

      pi++;
      pp++;
    }

    while (pi < patternParts.length && patternParts[pi] === "**") pi++;
    return pi === patternParts.length && pp === pathParts.length;
  }

  private parseSourceFile(sf: SourceFile): DocFile {
    const exports = sf.getExportedDeclarations();
    const docExports: DocExport[] = [];

    for (const [name, declarations] of exports) {
      for (const decl of declarations) {
        const doc = extractDeclaration(decl, name, sf, this.options);
        if (doc) docExports.push(doc);
      }
    }

    if (this.options.sortBy === "alphabetical") {
      docExports.sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      sourceFile: sf.getFilePath(),
      fileName: sf.getBaseName().replace(/\.ts$/, ""),
      exports: docExports,
    };
  }

  private parseSubmodule(
    relPath: string,
    sourceFiles: SourceFile[],
  ): DocModule | null {
    const name = relPath.split("/").pop() ?? relPath;

    const files: DocFile[] = [];
    let readme: { jsdoc: JSDocBlock; fileName: string } | undefined;

    for (const sf of sourceFiles) {
      if (sf.getBaseName() === "index.ts") {
        const r = this.parseIndexFile(sf);
        if (r) readme = r;
      } else {
        files.push(this.parseSourceFile(sf));
      }
    }

    return {
      name,
      relativePath: relPath,
      files,
      submodules: [],
      readme,
    };
  }

  private parseIndexFile(
    sf: SourceFile,
  ): { jsdoc: JSDocBlock; fileName: string } | null {
    try {
      const jsdocs = (sf as any).getJsDocs?.();
      if (!jsdocs?.length) return null;
      return {
        jsdoc: {
          summary:
            (jsdocs[0] as any).getDescription?.()?.getText?.()?.trim() ?? "",
          description: "",
          tags: [],
          examples: [],
        },
        fileName: sf.getBaseName(),
      };
    } catch {
      return null;
    }
  }

  private groupByDirectory(
    sourceFiles: SourceFile[],
  ): Record<string, SourceFile[]> {
    const groups: Record<string, SourceFile[]> = {};

    for (const sf of sourceFiles) {
      const dir = sf.getDirectoryPath();
      if (!groups[dir]) groups[dir] = [];
      groups[dir].push(sf);
    }

    return groups;
  }

  private relativePath(dirPath: string): string {
    const inputPath = this.options.input.replace(/\\/g, "/");
    const dirPathNorm = dirPath.replace(/\\/g, "/");
    if (dirPathNorm === inputPath) return "";
    return dirPathNorm.slice(inputPath.length + 1);
  }

  private inferBaseName(): string {
    const parts = this.options.input.split(/[\\/]/);
    return parts[parts.length - 1] || "module";
  }
}
