import type { FormatterOptions } from "../types.js";
import { DEFAULT_INSERT_FINAL_NEWLINE } from "../util/constants.js";
import { getEndOfLine } from "../util/getEndOfLine.js";
import type {
    Snippet,
    SnippetFile,
    SnippetHeader,
    SnippetVariable,
} from "./snippetTypes.js";

export type Options = FormatterOptions<"endOfLine" | "insertFinalNewline">;

export function serializeSnippetFile(
    snippetFile: SnippetFile,
    options: Options = {},
): string {
    const eol = getEndOfLine(options.endOfLine);
    const serializer = new SnippetSerializer(
        eol,
        options.insertFinalNewline ?? DEFAULT_INSERT_FINAL_NEWLINE,
    );
    return serializer.getText(snippetFile);
}

class SnippetSerializer {
    constructor(
        private eol: string,
        private insertFinalNewline: boolean,
    ) {}

    getText(snippetFile: SnippetFile): string {
        const documents: string[] = [];

        if (snippetFile.header != null) {
            documents.push(this.getDocumentText(snippetFile.header));
        }

        documents.push(
            ...snippetFile.snippets.map(this.getDocumentText.bind(this)),
        );

        // Remove empty documents
        const result = documents
            .filter(Boolean)
            .join(`${this.eol}---${this.eol}${this.eol}`);

        if (result.length === 0) {
            return "";
        }

        if (this.insertFinalNewline) {
            return result + `${this.eol}---${this.eol}`;
        }

        return result + `${this.eol}---`;
    }

    private getDocumentText(document: SnippetHeader | Snippet): string {
        const parts: string[] = [
            getOptionalPairString("name", document.name),
            getOptionalPairString("description", document.description),
            getOptionalPairString("language", document.languages),
            getOptionalPairString("phrase", document.phrases),
            getOptionalPairString("insertionScope", document.insertionScopes),
        ].filter(Boolean);

        if (document.variables.length > 0) {
            if (parts.length > 0) {
                parts.push("");
            }
            parts.push(...getSortedVariables(document.variables));
        }

        if ("body" in document) {
            parts.push("-", ...document.body);
        }

        return parts.join(this.eol);
    }
}

function getSortedVariables(variables: SnippetVariable[]): string[] {
    const result = [...variables];
    result.sort(compareVariables);
    return result
        .flatMap((variable) => [
            getOptionalPairString(
                `$${variable.name}.insertionFormatter`,
                variable.insertionFormatters,
            ),
            getOptionalPairString(
                `$${variable.name}.wrapperPhrase`,
                variable.wrapperPhrases,
            ),
            getOptionalPairString(
                `$${variable.name}.wrapperScope`,
                variable.wrapperScope,
            ),
        ])
        .filter(Boolean);
}

function getOptionalPairString(
    key: string,
    value: string | string[] | undefined,
): string {
    if (value == null) {
        return "";
    }
    if (Array.isArray(value)) {
        return `${key}: ${value.join(" | ")}`;
    }
    return `${key}: ${value}`;
}

function compareVariables(a: SnippetVariable, b: SnippetVariable): number {
    if (a.name === "0") {
        return 1;
    }
    if (b.name === "0") {
        return -1;
    }
    return a.name.localeCompare(b.name);
}
