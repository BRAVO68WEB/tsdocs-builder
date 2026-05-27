import {
  type ClassDeclaration,
  type EnumDeclaration,
  FunctionDeclaration,
  type InterfaceDeclaration,
  type MethodDeclaration,
  type ParameterDeclaration,
  type TypeAliasDeclaration,
  type VariableDeclaration,
} from "ts-morph";
import type {
  DocClass,
  DocConstant,
  DocConstructor,
  DocEnum,
  DocEnumMember,
  DocExport,
  DocFunction,
  DocInterface,
  DocInterfaceMember,
  DocMethod,
  DocProperty,
  DocTypeAlias,
  TsDocsOptions,
} from "../types/doc-types.ts";
import { slugify } from "../utils/path-utils.ts";
import { parseJSDoc } from "./jsdoc-parser.ts";

function cleanTypeName(text: string): string {
  return text.replace(/import\("[^"]+"\)\.?/g, "").trim();
}

export function extractDeclaration(
  decl: import("ts-morph").Node,
  exportedName: string,
  sf: import("ts-morph").SourceFile,
  options: TsDocsOptions,
): DocExport | null {
  try {
    if (
      decl instanceof FunctionDeclaration ||
      (decl as any).getKindName?.() === "FunctionDeclaration"
    ) {
      return extractFunction(
        decl as FunctionDeclaration,
        exportedName,
        sf,
        options,
      );
    }
  } catch {}

  try {
    if (decl.getKindName?.() === "InterfaceDeclaration") {
      return extractInterface(
        decl as InterfaceDeclaration,
        exportedName,
        sf,
        options,
      );
    }
  } catch {}

  try {
    if (decl.getKindName?.() === "TypeAliasDeclaration") {
      return extractTypeAlias(
        decl as TypeAliasDeclaration,
        exportedName,
        sf,
        options,
      );
    }
  } catch {}

  try {
    if (decl.getKindName?.() === "ClassDeclaration") {
      return extractClass(decl as ClassDeclaration, exportedName, sf, options);
    }
  } catch {}

  try {
    if (decl.getKindName?.() === "EnumDeclaration") {
      return extractEnum(decl as EnumDeclaration, exportedName, sf, options);
    }
  } catch {}

  try {
    if (decl.getKindName?.() === "VariableDeclaration") {
      return extractConstant(
        decl as VariableDeclaration,
        exportedName,
        sf,
        options,
      );
    }
  } catch {}

  return null;
}

function extractFunction(
  decl: FunctionDeclaration,
  name: string,
  sf: import("ts-morph").SourceFile,
  options: TsDocsOptions,
): DocFunction | null {
  try {
    const jsdoc = parseJSDoc(decl);
    if (options.skipInternal && jsdoc.isInternal) return null;
    if (jsdoc.isIgnore) return null;

    const params = decl.getParameters().map((p: ParameterDeclaration) => ({
      name: p.getName(),
      type: cleanTypeName(p.getType().getText()),
      optional: p.isOptional(),
      hasQuestionToken: p.hasQuestionToken(),
      defaultValue: p.getInitializer()?.getText(),
    }));

    const signature = buildFunctionSignature(decl);

    return {
      kind: "function",
      name,
      signature,
      params,
      returnType: cleanTypeName(decl.getReturnType().getText()),
      isAsync: decl.isAsync(),
      isExported: true,
      jsdoc,
      sourceLocation: `${sf.getFilePath().split("/").pop()}:${decl.getStartLineNumber()}`,
    };
  } catch {
    return null;
  }
}

function extractInterface(
  decl: InterfaceDeclaration,
  name: string,
  sf: import("ts-morph").SourceFile,
  options: TsDocsOptions,
): DocInterface | null {
  try {
    const allMembers = (decl as any).getProperties().map((p: any) => ({
      name: p.getName(),
      type: cleanTypeName(p.getType().getText()),
      optional: (p as any).isOptional?.() ?? false,
      readonly: (p as any).isReadonly?.() ?? false,
      jsdoc: parseJSDoc(p),
    }));

    const members: DocInterfaceMember[] = [];
    for (const m of allMembers) {
      if (options.skipInternal && m.jsdoc.isInternal) continue;
      if (m.jsdoc.isIgnore) continue;
      members.push(m);
    }

    const extendsTypes =
      decl
        .getExtends()
        ?.map((e: any) => cleanTypeName(e.getType().getText())) ?? [];

    return {
      kind: "interface",
      name,
      signature: buildInterfaceSignature(decl),
      members,
      extends: extendsTypes.length ? extendsTypes : undefined,
      typeParams: decl.getTypeParameters().map((t: any) => t.getName()),
      jsdoc: parseJSDoc(decl),
      sourceLocation: `${sf.getFilePath().split("/").pop()}:${decl.getStartLineNumber()}`,
    };
  } catch {
    return null;
  }
}

function extractTypeAlias(
  decl: TypeAliasDeclaration,
  name: string,
  sf: import("ts-morph").SourceFile,
  options: TsDocsOptions,
): DocTypeAlias | null {
  try {
    const jsdoc = parseJSDoc(decl);
    if (options.skipInternal && jsdoc.isInternal) return null;
    if (jsdoc.isIgnore) return null;

    return {
      kind: "type",
      name,
      signature: decl.getText().replace(/^export\s+/, ""),
      typeParams: decl.getTypeParameters().map((t: any) => t.getName()),
      jsdoc,
      sourceLocation: `${sf.getFilePath().split("/").pop()}:${decl.getStartLineNumber()}`,
    };
  } catch {
    return null;
  }
}

function extractClass(
  decl: ClassDeclaration,
  name: string,
  sf: import("ts-morph").SourceFile,
  options: TsDocsOptions,
): DocClass | null {
  try {
    const constructors: DocConstructor[] = decl
      .getConstructors()
      .map((c: any) => ({
        parameters: c.getParameters().map((p: any) => ({
          name: p.getName(),
          type: cleanTypeName(p.getType().getText()),
          optional: p.isOptional?.() ?? false,
          hasQuestionToken: p.hasQuestionToken?.() ?? false,
          defaultValue: p.getInitializer?.()?.getText(),
        })),
      }));

    const allProps = (decl as any).getInstanceProperties?.() ?? [];
    const allMethods = (decl as any).getInstanceMethods?.() ?? [];

    const properties: DocProperty[] = [];
    const methods: DocMethod[] = [];

    for (const p of allProps) {
      if (options.skipPrivate && isPrivate(p)) continue;
      const jsdoc = parseJSDoc(p);
      if (options.skipDeprecated && jsdoc.deprecated) continue;
      if (options.skipInternal && jsdoc.isInternal) continue;
      if (jsdoc.isIgnore) continue;

      properties.push({
        name: p.getName(),
        anchorId: slugify(p.getName()),
        type: cleanTypeName(p.getType().getText()),
        optional: (p as any).isOptional?.() ?? false,
        isReadonly: (p as any).isReadonly?.() ?? false,
        isStatic: (p as any).isStatic?.() ?? false,
        jsdoc,
      });
    }

    for (const m of allMethods) {
      if (options.skipPrivate && isPrivate(m)) continue;
      const jsdoc = parseJSDoc(m);
      if (options.skipDeprecated && jsdoc.deprecated) continue;
      if (options.skipInternal && jsdoc.isInternal) continue;
      if (jsdoc.isIgnore) continue;

      const params =
        m.getParameters?.()?.map((p: any) => ({
          name: p.getName(),
          type: cleanTypeName(p.getType().getText()),
          optional: p.isOptional?.() ?? false,
          hasQuestionToken: p.hasQuestionToken?.() ?? false,
          defaultValue: p.getInitializer?.()?.getText(),
        })) ?? [];

      methods.push({
        name: m.getName(),
        anchorId: slugify(m.getName()),
        signature: buildMethodSignature(m),
        returnType: cleanTypeName(m.getReturnType().getText()),
        isAsync: m.isAsync?.() ?? false,
        isStatic: (m as any).isStatic?.() ?? false,
        params,
        jsdoc,
        sourceLocation: `${sf.getFilePath().split("/").pop()}:${m.getStartLineNumber()}`,
      });
    }

    return {
      kind: "class",
      name,
      signature: buildClassSignature(decl),
      extends: cleanTypeName(decl.getExtends()?.getType().getText() ?? ""),
      implements: decl
        .getImplements()
        .map((i: any) => cleanTypeName(i.getType().getText())),
      constructors,
      properties,
      methods,
      jsdoc: parseJSDoc(decl),
      sourceLocation: `${sf.getFilePath().split("/").pop()}:${decl.getStartLineNumber()}`,
    };
  } catch {
    return null;
  }
}

function extractEnum(
  decl: EnumDeclaration,
  name: string,
  sf: import("ts-morph").SourceFile,
  options: TsDocsOptions,
): DocEnum | null {
  try {
    const jsdoc = parseJSDoc(decl);
    if (options.skipInternal && jsdoc.isInternal) return null;
    if (jsdoc.isIgnore) return null;

    const members: DocEnumMember[] = decl.getMembers().map((m: any) => ({
      name: m.getName(),
      value: m.getValue?.() ?? m.getText(),
      jsdoc: parseJSDoc(m),
    }));

    return {
      kind: "enum",
      name,
      isConst: decl.isConstEnum(),
      members,
      jsdoc,
      sourceLocation: `${sf.getFilePath().split("/").pop()}:${decl.getStartLineNumber()}`,
    };
  } catch {
    return null;
  }
}

function extractConstant(
  decl: VariableDeclaration,
  name: string,
  sf: import("ts-morph").SourceFile,
  options: TsDocsOptions,
): DocConstant | null {
  try {
    const jsdoc = parseJSDoc(decl);
    if (options.skipInternal && jsdoc.isInternal) return null;
    if (jsdoc.isIgnore) return null;

    return {
      kind: "constant",
      name,
      signature: `const ${name}: ${cleanTypeName(decl.getType().getText())}`,
      jsdoc,
      sourceLocation: `${sf.getFilePath().split("/").pop()}:${decl.getStartLineNumber()}`,
    };
  } catch {
    return null;
  }
}

function buildFunctionSignature(decl: FunctionDeclaration): string {
  const params = decl
    .getParameters()
    .map((p: any) => {
      const name = p.getName();
      const isOptional = p.isOptional();
      const def = p.getInitializer?.()?.getText();
      let s = name;
      if (isOptional && !name.includes("?")) s = `${name}?`;
      if (def) s += ` = ${def}`;
      return s;
    })
    .join(", ");

  const asyncKw = decl.isAsync() ? "async " : "";
  const retType = cleanTypeName(decl.getReturnType().getText());

  return `${asyncKw}${decl.getName()}(${params}): ${retType}`;
}

function buildMethodSignature(m: MethodDeclaration): string {
  const params = (m.getParameters?.() ?? [])
    .map((p: any) => {
      const name = p.getName();
      const isOptional = p.isOptional?.() ?? false;
      const def = p.getInitializer?.()?.getText();
      let s = name;
      if (isOptional && !name.includes("?")) s = `${name}?`;
      if (def) s += ` = ${def}`;
      return s;
    })
    .join(", ");

  const asyncKw = m.isAsync?.() ? "async " : "";
  const retType = cleanTypeName(m.getReturnType().getText());
  const staticKw = (m as any).isStatic?.() ? "static " : "";

  return `${staticKw}${asyncKw}${m.getName()}(${params}): ${retType}`;
}

function buildInterfaceSignature(decl: InterfaceDeclaration): string {
  const name = decl.getName();
  const typeParams = decl.getTypeParameters();
  const ext = decl.getExtends();

  let sig = name;
  if (typeParams.length) {
    sig += `<${typeParams.map((t: any) => t.getName()).join(", ")}>`;
  }
  if (ext?.length) {
    sig += ` extends ${ext.map((e: any) => cleanTypeName(e.getType().getText())).join(", ")}`;
  }
  sig += " { /* members */ }";
  return sig;
}

function buildClassSignature(decl: ClassDeclaration): string {
  const name = decl.getName();
  const typeParams = decl.getTypeParameters();
  const ext = decl.getExtends();
  const impl = decl.getImplements();

  let sig = name;
  if (typeParams.length) {
    sig += `<${typeParams.map((t: any) => t.getName()).join(", ")}>`;
  }
  if (ext) {
    sig += ` extends ${cleanTypeName(ext.getType().getText())}`;
  }
  if (impl?.length) {
    sig += ` implements ${impl.map((i: any) => cleanTypeName(i.getType().getText())).join(", ")}`;
  }
  return sig!;
}

function isPrivate(node: any): boolean {
  return (
    node
      .getModifiers?.()
      ?.some(
        (m: any) => m.getText() === "private" || m.getText() === "protected",
      ) ?? false
  );
}
