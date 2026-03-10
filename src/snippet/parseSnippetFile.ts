import type { Snippet, SnippetFile, SnippetVariable } from "./snippetTypes.js";

export function parseSnippetFile(content: string): SnippetFile {
    const documentContents = content.split(/^---$/m);
    const file: SnippetFile = { snippets: [] };

    for (const text of documentContents) {
        const match = text.match(/^-$/m);
        const contextText = match != null ? text.slice(0, match.index) : text;
        const bodyText =
            match != null ? text.slice(match.index! + match[0].length) : null;
        const body = bodyText ? parseBody(bodyText) : null;
        let context = parseContext(contextText);

        // Snippet with body
        if (body != null) {
            if (context == null) {
                context = { variables: [] };
            }
            const { variables, ...rest } = context;
            file.snippets.push({ ...rest, body, variables });
        }
        // Header without body
        else if (context != null) {
            if (file.header != null || file.snippets.length !== 0) {
                throw Error("Header snippet must be first in file");
            }
            file.header = context;
        }
    }

    return file;
}

type Context = Omit<Snippet, "body">;

function parseContext(text: string): Context | undefined {
    const document: Context = { variables: [] };
    const pairs = parseContextPairs(text);

    if (Object.keys(pairs).length === 0) {
        return undefined;
    }

    const variables: Record<string, string> = {};

    for (const [key, value] of Object.entries(pairs)) {
        switch (key) {
            case "name":
                document.name = value;
                break;
            case "description":
                document.description = value;
                break;
            case "phrase":
                document.phrases = parseVectorValue(value);
                break;
            case "insertionScope":
                document.insertionScopes = parseVectorValue(value);
                break;
            case "language":
                document.languages = parseVectorValue(value);
                break;
            default:
                if (!key.startsWith("$")) {
                    throw Error(`Invalid key '${key}'`);
                }
                variables[key] = value;
        }
    }

    document.variables = parseVariables(variables);

    return document;
}

function parseContextPairs(text: string): Record<string, string> {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    const pairs: Record<string, string> = {};

    for (const line of lines) {
        const parts = line.split(":");
        if (parts.length !== 2) {
            throw Error(`Invalid line '${line}'`);
        }
        const key = parts[0].trim();
        const value = parts[1].trim();
        if (key.length === 0 || value.length === 0) {
            throw Error(`Invalid line '${line}'`);
        }
        if (pairs[key] != null) {
            throw Error(`Duplicate key '${key}' in '${text}'`);
        }
        pairs[key] = value;
    }

    return pairs;
}

function parseVariables(variables: Record<string, string>): SnippetVariable[] {
    const variablesMap: Record<string, SnippetVariable> = {};

    const getVariable = (name: string): SnippetVariable => {
        if (variablesMap[name] == null) {
            variablesMap[name] = { name };
        }
        return variablesMap[name];
    };

    for (const [key, value] of Object.entries(variables)) {
        const parts = key.split(".");
        if (parts.length !== 2) {
            throw Error(`Invalid variable key '${key}'`);
        }
        const name = parts[0].slice(1);
        const field = parts[1];
        switch (field) {
            case "insertionFormatter":
                getVariable(name).insertionFormatters = parseVectorValue(value);
                break;
            case "wrapperPhrase":
                getVariable(name).wrapperPhrases = parseVectorValue(value);
                break;
            case "wrapperScope":
                getVariable(name).wrapperScope = value;
                break;
            default:
                throw Error(`Invalid variable key '${key}'`);
        }
    }

    return Object.values(variablesMap);
}

function parseBody(text: string): string[] | undefined {
    // Find first line that is not empty. Preserve indentation.
    const matchLeading = text.match(/^[ \t]*\S/m);
    if (matchLeading?.index == null) {
        return undefined;
    }
    return text
        .slice(matchLeading.index)
        .trimEnd()
        .split(/\r?\n/)
        .map((l) => l.trimEnd());
}

function parseVectorValue(value: string): string[] {
    return value.split("|").map((v) => v.trim());
}
