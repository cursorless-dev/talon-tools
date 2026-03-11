import type { FormatterOptions, SyntaxNode } from "./types.js";
type Options = FormatterOptions<"endOfLine" | "indentTabs" | "indentSize" | "insertFinalNewline">;
export declare function treeSitterFormatter(node: SyntaxNode, options?: Options, debug?: boolean): string;
export {};
