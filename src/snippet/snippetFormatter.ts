import { parseSnippetFile, serializeSnippetFile } from "talon-snippets";

export function snippetFormatter(text: string): string {
    const documents = parseSnippetFile(text);
    return serializeSnippetFile(documents);
}
