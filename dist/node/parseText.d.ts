import type { Node } from "web-tree-sitter";
type ParserName = "tree-sitter-talon" | "tree-sitter-query";
export declare function parseText(text: string, parserName: ParserName): Promise<Node>;
export {};
