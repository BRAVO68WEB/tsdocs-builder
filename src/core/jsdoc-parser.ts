import type { JSDocBlock, JSDocTag } from "../types/doc-types.ts";

function safeCall(obj: any, method: string): any {
 return typeof obj?.[method] === "function" ? obj[method]() : undefined;
}

function safeText(val: any): string {
 if (typeof val === "string") return val;
 return safeCall(val, "getText") ?? "";
}

export function parseJSDoc(node: any): JSDocBlock {
 const jsDocs = (node as any).getJsDocs?.() ?? [];
 if (!jsDocs.length) return emptyBlock();

 const doc = jsDocs[0];
 const tags: JSDocTag[] = [];
 const tagEntries = (doc as any).getTags?.() ?? [];

 for (const tag of tagEntries) {
 const tagName = safeText(tag.getTagNameNode?.()) ?? "";
 const comment = safeText(tag.getCommentText) ?? "";

 if (tagName === "param") {
 const tagNode = tag as any;
 const paramName = safeText(tagNode.getName?.()) ?? "";
 const typeNode = tagNode.getTypeExpression?.()?.getTypeNode();
 tags.push({
 name: "param",
 content: comment,
 type: safeText(safeCall(typeNode, "getType")),
 paramName,
 });
 } else if (tagName === "returns" || tagName === "return") {
 const tagNode = tag as any;
 const typeNode = tagNode.getTypeExpression?.()?.getTypeNode();
 tags.push({
 name: "returns",
 content: comment,
 type: safeText(safeCall(typeNode, "getType")),
 });
 } else if (tagName === "example") {
 tags.push({ name: "example", content: comment });
 } else if (tagName === "deprecated") {
 tags.push({ name: "deprecated", content: comment });
 } else if (tagName === "see") {
 tags.push({ name: "see", content: comment });
 } else if (tagName === "remarks" || tagName === "remark") {
 tags.push({ name: "remarks", content: comment });
 } else if (tagName === "description") {
 tags.push({ name: "description", content: comment });
 } else {
 tags.push({ name: tagName, content: comment });
 }
 }

 const desc = doc.getDescription?.();
 const fullText = safeText(desc);
 const firstNewline = fullText.indexOf("\n");
 const summary =
 firstNewline === -1 ? fullText : fullText.slice(0, firstNewline);
 const description =
 firstNewline === -1 ? "" : fullText.slice(firstNewline).trim();

 return {
 summary: summary.trim(),
 description,
 tags,
 examples: tags.filter((t) => t.name === "example").map((t) => t.content),
 deprecated: tags.find((t) => t.name === "deprecated")?.content,
 isInternal: tags.some((t) => t.name === "internal"),
 isIgnore: tags.some((t) => t.name === "ignore"),
 };
}

function emptyBlock(): JSDocBlock {
 return { summary: "", description: "", tags: [], examples: [] };
}

export function extractParamTags(tags: JSDocTag[]): Map<string, JSDocTag> {
 const map = new Map<string, JSDocTag>();
 for (const tag of tags) {
 if (tag.name === "param" && tag.paramName) {
 map.set(tag.paramName, tag);
 }
 }
 return map;
}

export function extractReturnsTag(tags: JSDocTag[]): JSDocTag | undefined {
 return tags.find((t) => t.name === "returns");
}

export function extractRemarksTags(tags: JSDocTag[]): string[] {
 return tags.filter((t) => t.name === "remarks").map((t) => t.content);
}