import type { FormatterOptions } from "../types.js";
import type { SnippetFile } from "./snippetTypes.js";
export type Options = FormatterOptions<"endOfLine" | "insertFinalNewline">;
export declare function serializeSnippetFile(snippetFile: SnippetFile, options?: Options): string;
