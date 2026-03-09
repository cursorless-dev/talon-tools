export interface CLI {
    binName: "snippet-fmt" | "talon-fmt" | "tree-sitter-fmt";
    fileEndings: string[];

    format(text: string, options: Options, fileName: string): Promise<string>;
}

export interface Options {
    indentTabs: boolean;
    indentWidth: number;
    lineWidth: number;
    columnWidth: number | undefined;
}

export interface ParsedArgs extends Options {
    filePatterns: string[];
    help: boolean;
    version: boolean;
    check: boolean;
}
