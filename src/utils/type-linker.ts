const BUILTIN_TYPES = new Set([
  "string",
  "number",
  "boolean",
  "void",
  "any",
  "never",
  "null",
  "undefined",
  "unknown",
  "object",
  "this",
  "Array",
  "Promise",
  "Record",
  "Partial",
  "Required",
  "Readonly",
  "Omit",
  "Pick",
  "Exclude",
  "Extract",
  "NonNullable",
  "ReturnType",
  "Parameters",
  "InstanceType",
  "ConstructorParameters",
  "ReadonlyArray",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "Error",
  "MapConstructor",
  "SetConstructor",
  "ArrayConstructor",
  "RegExp",
  "Date",
  "JSON",
  "Math",
  "console",
]);

export function linkTypesInText(
  text: string,
  typeMap: Map<string, string>,
): string {
  return text.replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, (match) => {
    if (BUILTIN_TYPES.has(match) || !typeMap.has(match)) return match;
    const link = typeMap.get(match);
    return link !== undefined ? `[${match}](./${link})` : match;
  });
}

export function isBuiltinType(name: string): boolean {
  return BUILTIN_TYPES.has(name);
}

export function extractTypeNames(text: string): string[] {
  const matches = text.matchAll(/\b([A-Z][a-zA-Z0-9]*)\b/g);
  return [...matches].map((m) => m[1]);
}
