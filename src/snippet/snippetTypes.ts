export interface SnippetFile {
    header?: SnippetHeader;
    snippets: Snippet[];
}

export interface SnippetHeader {
    name?: string;
    description?: string;
    phrases?: string[];
    insertionScopes?: string[];
    languages?: string[];
    variables: SnippetVariable[];
}

export interface Snippet extends SnippetHeader {
    body: string[];
}

export interface SnippetVariable {
    name: string;
    insertionFormatters?: string[];
    wrapperPhrases?: string[];
    wrapperScope?: string;
}
