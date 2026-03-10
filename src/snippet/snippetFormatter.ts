import { parseSnippetFile } from "./parseSnippetFile.js";
import { serializeSnippetFile } from "./serializeSnippetFile.js";
import type { Options } from "./serializeSnippetFile.js";

export function snippetFormatter(text: string, options?: Options): string {
    const snippetFile = parseSnippetFile(text);
    return serializeSnippetFile(snippetFile, options);
}
