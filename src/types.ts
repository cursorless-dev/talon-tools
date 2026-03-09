export const GLOBAL_FLAG_ARGUMENTS = [
    "--help",
    "--version",
    "--check",
] as const;

export const KNOWN_FLAG_ARGUMENTS = ["--indent-tabs"] as const;

export const KNOWN_VALUE_ARGUMENTS = [
    "--indent-width",
    "--line-width",
    "--column-width",
] as const;

export type GlobalFlagArg = (typeof GLOBAL_FLAG_ARGUMENTS)[number];
export type FlagArg = (typeof KNOWN_FLAG_ARGUMENTS)[number];
export type ValueArg = (typeof KNOWN_VALUE_ARGUMENTS)[number];

export interface CLI {
    binName: "snippet-fmt" | "talon-fmt" | "tree-sitter-fmt";
    fileEndings: readonly string[];
    supportedFlagArgs: readonly FlagArg[];
    supportedValueArgs: readonly ValueArg[];

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
