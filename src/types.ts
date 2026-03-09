export interface CLI {
    binName: "snippet-fmt" | "talon-fmt" | "tree-sitter-fmt";

    format(text: string, fileName: string): Promise<string>;
}

export interface ParsedArgs {
    filePatterns: string[];
    help: boolean;
    check: boolean;
}
