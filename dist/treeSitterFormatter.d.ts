import type { FormatterOptions, SyntaxNode } from "./types.js";
export type Options = FormatterOptions<"endOfLine" | "indentTabs" | "indentSize" | "insertFinalNewline">;
export declare function treeSitterFormatter(node: SyntaxNode, options?: Options, debug?: boolean): string;
