export interface JSDocTag {
  name: string;
  content: string;
  type?: string;
  paramName?: string;
}

export interface JSDocBlock {
  summary: string;
  description: string;
  tags: JSDocTag[];
  examples: string[];
  deprecated?: string;
  isInternal?: boolean;
  isIgnore?: boolean;
}

export interface DocParam {
  name: string;
  type: string;
  optional: boolean;
  hasQuestionToken: boolean;
  defaultValue?: string;
}

export interface DocConstructor {
  parameters: DocParam[];
}

export interface DocProperty {
  name: string;
  type: string;
  optional: boolean;
  isReadonly: boolean;
  isStatic: boolean;
  anchorId?: string;
  jsdoc: JSDocBlock;
}

export interface DocMethod {
  name: string;
  signature: string;
  returnType: string;
  isAsync: boolean;
  isStatic: boolean;
  anchorId?: string;
  params: DocParam[];
  jsdoc: JSDocBlock;
  sourceLocation: string;
}

export interface DocInterfaceMember {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
  jsdoc: JSDocBlock;
}

export interface DocEnumMember {
  name: string;
  value?: string | number;
  jsdoc: JSDocBlock;
}

export interface DocFunction {
  kind: "function";
  name: string;
  signature: string;
  params: DocParam[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  jsdoc: JSDocBlock;
  sourceLocation: string;
}

export interface DocInterface {
  kind: "interface";
  name: string;
  signature: string;
  members: DocInterfaceMember[];
  extends?: string[];
  typeParams?: string[];
  jsdoc: JSDocBlock;
  sourceLocation: string;
}

export interface DocTypeAlias {
  kind: "type";
  name: string;
  signature: string;
  typeParams?: string[];
  jsdoc: JSDocBlock;
  sourceLocation: string;
}

export interface DocClass {
  kind: "class";
  name: string;
  signature: string;
  extends?: string;
  implements?: string[];
  constructors: DocConstructor[];
  properties: DocProperty[];
  methods: DocMethod[];
  jsdoc: JSDocBlock;
  sourceLocation: string;
}

export interface DocEnum {
  kind: "enum";
  name: string;
  isConst: boolean;
  members: DocEnumMember[];
  jsdoc: JSDocBlock;
  sourceLocation: string;
}

export interface DocConstant {
  kind: "constant";
  name: string;
  signature: string;
  jsdoc: JSDocBlock;
  sourceLocation: string;
}

export type DocExport =
  | DocFunction
  | DocInterface
  | DocTypeAlias
  | DocClass
  | DocEnum
  | DocConstant;

export interface DocFile {
  sourceFile: string;
  fileName: string;
  exports: DocExport[];
}

export interface DocModule {
  name: string;
  relativePath: string;
  files: DocFile[];
  submodules: DocModule[];
  readme?: { jsdoc: JSDocBlock; fileName: string };
}

export type SortBy = "alphabetical" | "source" | "category";
export type GroupBy = "kind" | "folder";
export type SidebarStyle =
  | "docusaurus"
  | "mintlify"
  | "fumadocs"
  | "vitepress"
  | "neutrino";

export interface TsDocsOptions {
  input: string;
  output: string;
  baseName?: string;
  include?: string[];
  exclude?: string[];
  skipPrivate: boolean;
  skipDeprecated: boolean;
  ignoreSources?: boolean;
  skipInternal?: boolean;
  sidebar: boolean;
  sidebarStyle: SidebarStyle;
  groupBy: GroupBy;
  sortBy: SortBy;
  treatAsSingleModule: boolean;
  config?: string;
}

export interface SidebarItem {
  label: string;
  link?: { href: string };
  items?: SidebarItem[];
}
