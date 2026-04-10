import type { KnownProps } from "editorconfig";

export const KNOWN_ARGUMENTS = [
    "--help",
    "--version",
    "--quiet",
    "--check",
    "--debug",
] as const;

export type KnownArgument = (typeof KNOWN_ARGUMENTS)[number];

export function isKnownArgument(value: string): value is KnownArgument {
    return (KNOWN_ARGUMENTS as readonly string[]).includes(value);
}

export interface CLI {
    binName: "snippet-fmt" | "talon-fmt" | "tree-sitter-fmt";
    fileEndings: readonly string[];

    getStdinFileEnding(text: string): string;
    format(
        text: string,
        options: Options,
        filePath: string,
        debug: boolean,
    ): Promise<string>;
}

export type EndOfLine = "lf" | "crlf";

export interface Options {
    endOfLine?: EndOfLine;
    indentTabs?: boolean;
    indentSize?: number;
    maxLineLength?: number;
    columnWidth?: number;
    insertFinalNewline?: boolean;
    preserveMultiline?: boolean;
}

export type FormatterOptions<K extends keyof Options> = Pick<Options, K>;

export interface ParsedArgs {
    filePatterns: string[];
    help: boolean;
    version: boolean;
    check: boolean;
    quiet: boolean;
    debug: boolean;
}

export interface LoggerEntry {
    level: "log" | "warn" | "error";
    message: string;
}

export interface Logger {
    log(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

export interface TestLogger extends Logger {
    getEntries(): readonly LoggerEntry[];
}

export interface DebugLogger {
    debug(message: string): void;
}

export interface EditorConfigOptions extends KnownProps {
    max_line_length?: number | "unset";
    column_width?: number | "unset";
    preserve_multiline?: boolean | "unset";
}

export interface Point {
    row: number;
    column: number;
}

/**
 * Internal representation of the Tree sitter node. Used so that our api doesn't
 * need to export or expose clients to Tree sitter types. Also makes it simple
 * to write tests internally.
 */
export interface SyntaxNode {
    id: number;
    text: string;
    type: string;
    startPosition: Point;
    endPosition: Point;
    hasError: boolean;
    isError: boolean;
    isMissing: boolean;
    parent: SyntaxNode | null;
    children: SyntaxNode[];
}
