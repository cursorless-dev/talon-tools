import type { FormatterOptions } from "../types.js";
type Options = FormatterOptions<"endOfLine" | "columnWidth" | "insertFinalNewline">;
export declare function talonListFormatter(text: string, options?: Options): string;
export {};
