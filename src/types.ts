export interface CLI {
    binName: "snippet-fmt" | "talon-fmt" | "tree-sitter-fmt";
    fileEndings: string[];

    format(text: string, fileName: string): Promise<string>;
}

export interface ParsedArgs {
    filePatterns: string[];
    help: boolean;
    version: boolean;
    check: boolean;
    indentTabs: boolean;
    indentWidth: number;
    lineWidth: number;
    columnWidth: number | undefined;
}
