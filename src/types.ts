export interface CLI {
    binName:
        | "talon-fmt"
        | "talon-list-fmt"
        | "talon-snippet-fmt"
        | "tree-sitter-query-fmt";

    format(text: string): Promise<string>;
}

export interface ParsedArgs {
    fileNames: string[];
    help: boolean;
    check: boolean;
}
