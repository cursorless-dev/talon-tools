import type { FormatterOptions, SyntaxNode } from "../types.js";
type Options = FormatterOptions<"endOfLine" | "indentTabs" | "indentSize" | "maxLineLength" | "columnWidth" | "insertFinalNewline" | "preserveMultiline">;
export declare function talonFormatter(node: SyntaxNode, options?: Options): string;
export {};
