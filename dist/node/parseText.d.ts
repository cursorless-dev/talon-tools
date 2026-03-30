import type { SyntaxNode } from "../types.js";
type ParserName = "tree-sitter-talon" | "tree-sitter-query";
export declare function parseText(text: string, parserName: ParserName): Promise<SyntaxNode>;
export {};
