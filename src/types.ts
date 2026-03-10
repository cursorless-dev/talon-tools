import type { KnownProps } from "editorconfig";

export const KNOWN_ARGUMENTS = ["--help", "--version", "--check"] as const;

export type KnownArgument = (typeof KNOWN_ARGUMENTS)[number];

export interface CLI {
    binName: "snippet-fmt" | "talon-fmt" | "tree-sitter-fmt";
    fileEndings: readonly string[];

    getStdinFileEnding(text: string): string;
    format(text: string, options: Options, filePath: string): Promise<string>;
}

export type EndOfLine = "lf" | "crlf";

export interface Options {
    indentTabs?: boolean;
    indentSize?: number;
    maxLineLength?: number;
    columnWidth?: number;
    endOfLine?: EndOfLine;
}

export interface ParsedArgs {
    filePatterns: string[];
    help: boolean;
    version: boolean;
    check: boolean;
}

/* eslint-disable @typescript-eslint/naming-convention */
export interface EditorConfigOptions extends KnownProps {
    max_line_length?: number | "unset";
    column_width?: number | "unset";
}
