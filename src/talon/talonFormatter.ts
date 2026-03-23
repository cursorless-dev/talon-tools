import type { DebugLogger, FormatterOptions, SyntaxNode } from "../types.js";
import {
    DEFAULT_INSERT_FINAL_NEWLINE,
    DEFAULT_MAX_LINE_LENGTH,
} from "../util/constants.js";
import { createDebugLogger } from "../util/createDebugLogger.js";
import { getColumnWidth } from "../util/getColumnWidth.js";
import { getEndOfLine } from "../util/getEndOfLine.js";
import { getIndentation } from "../util/getIndentation.js";
import { convertQuotes } from "./convertQuotes.js";

export type Options = FormatterOptions<
    | "endOfLine"
    | "indentTabs"
    | "indentSize"
    | "maxLineLength"
    | "columnWidth"
    | "insertFinalNewline"
    | "preserveMultiline"
>;

export function talonFormatter(
    node: SyntaxNode,
    options: Options = {},
    debug: boolean = false,
): string {
    const columnWidth = getColumnWidth(node.text) ?? options.columnWidth;
    const indentation = getIndentation(options.indentTabs, options.indentSize);
    const eol = getEndOfLine(options.endOfLine);
    const formatter = new TalonFormatter(
        indentation,
        eol,
        options.maxLineLength ?? DEFAULT_MAX_LINE_LENGTH,
        columnWidth,
        options.insertFinalNewline ?? DEFAULT_INSERT_FINAL_NEWLINE,
        options.preserveMultiline ?? false,
        debug,
    );
    return formatter.getText(node);
}

class TalonFormatter {
    private lines: string[] = [];
    private lastRow = 0;
    private logger: DebugLogger;

    constructor(
        private indent: string,
        private eol: string,
        private maxLineLength: number,
        private columnWidth: number | undefined,
        private insertFinalNewline: boolean,
        private preserveMultiline: boolean,
        debug: boolean,
    ) {
        this.logger = createDebugLogger(debug);
    }

    getText(node: SyntaxNode): string {
        this.addNode(node);

        const result = this.lines.join(this.eol).trimEnd();

        if (result.length === 0) {
            return "";
        }

        if (this.insertFinalNewline) {
            return result + this.eol;
        }

        return result;
    }

    private addNL(): void {
        if (this.lines[this.lines.length - 1] !== "") {
            this.lines.push("");
        }
    }

    private addNode(node: SyntaxNode, isIndented = false): void {
        if (node.startPosition.row > this.lastRow + 1) {
            this.addNL();
        }
        this.lastRow = node.endPosition.row;
        this.addNodeHelper(node, isIndented);
        this.lastRow = node.endPosition.row;
    }

    private addNodeHelper(node: SyntaxNode, isIndented = false): void {
        switch (node.type) {
            case "source_file":
                for (const n of node.children) {
                    this.addNode(n);
                }
                break;

            case "matches": {
                // There are  match nodes or there is a comment before
                if (node.children.length > 1 || !isFirstChild(node)) {
                    for (const n of node.children) {
                        this.addNode(n);
                    }
                    this.addNL();
                }
                break;
            }

            case "declarations":
                for (const n of node.children) {
                    this.addNode(n);
                }
                break;

            case "block":
                for (const n of node.children) {
                    this.addNode(n, true);
                }
                break;

            case "command_declaration":
            case "key_binding_declaration":
            case "parrot_declaration":
            case "noise_declaration":
            case "face_declaration":
            case "gamepad_declaration":
            case "deck_declaration":
                this.addLeftRightNode(node, false);
                break;

            case "settings_declaration":
                if (
                    this.lines.length > 0 &&
                    !this.lines[this.lines.length - 1].startsWith("#")
                ) {
                    this.addNL();
                }
                this.addLeftRightNode(node, true);
                this.addNL();
                break;

            case "comment": {
                // When using crlf eol comments have a trailing `\r`
                const text = node.text.trimEnd();
                const nodeText =
                    isIndented || node.startPosition.column > 0
                        ? `${this.indent}${text}`
                        : text;
                this.lines.push(nodeText);
                break;
            }

            default: {
                const nodeText = this.getNodeText(node);
                this.lines.push(
                    isIndented ? `${this.indent}${nodeText}` : nodeText,
                );
            }
        }
    }

    private getNodeText(node: SyntaxNode): string {
        switch (node.type) {
            case "source_file":
            case "matches":
            case "declarations":
            case "block":
            case "command_declaration":
            case "key_binding_declaration":
            case "parrot_declaration":
            case "noise_declaration":
            case "face_declaration":
            case "gamepad_declaration":
            case "deck_declaration":
            case "settings_declaration":
            case "comment":
                throw new Error(
                    `Node type '${node.type}' should be handled in addNode, not getNodeText`,
                );

            case "parenthesized_rule":
                return this.pairWithChildren(
                    node,
                    node.parent != null && rangeEqual(node, node.parent),
                );

            case "optional":
                return this.pairWithChildren(node);

            case "expression_statement":
            case "assignment_statement":
            case "seq":
            case "choice":
                return node.children.map((n) => this.getNodeText(n)).join(" ");

            case "rule":
            case "action":
            case "key_action":
            case "sleep_action":
            case "argument_list":
            case "key_binding":
            case "face_binding":
            case "gamepad_binding":
            case "parrot_binding":
            case "noise_binding":
            case "deck_binding":
            case "tag_import_declaration":
            case "match":
                return node.children.map((n) => this.getNodeText(n)).join("");

            case "string":
                return formatString(node);

            case "match_modifier":
            case ":":
            case ",":
                return `${node.text} `;

            case "implicit_string":
                return node.text.trim();

            case "tag_binding":
            case "settings_binding":
            case "capture":
            case "list":
            case "key(":
            case "sleep(":
            case "gamepad(":
            case "face(":
            case "parrot(":
            case "noise(":
            case "identifier":
            case "variable":
            case "word":
            case "binary_operator":
            case "integer":
            case "float":
            case "start_anchor":
            case "end_anchor":
            case "repeat":
            case "deck(":
            case "repeat1":
            case "(":
            case ")":
            case "=":
            case "-":
            case "|":
                return node.text;

            default:
                this.logger.debug(`Unknown syntax node type '${node.type}'`);
                return node.text;
        }
    }

    private pairWithChildren(
        node: SyntaxNode,
        unwrap: boolean = false,
    ): string {
        const { children } = node;
        const middle = children
            .slice(1, -1)
            .map((n) => this.getNodeText(n))
            .join(" ");
        if (unwrap) {
            return middle;
        }
        const pre = children[0].text;
        const post = children[children.length - 1].text;
        return `${pre}${middle}${post}`;
    }

    private addLeftRightNode(node: SyntaxNode, forceMultiline: boolean): void {
        const [leftNode, _colonNode, ...rightNodes] = node.children;
        const left = this.getNodeText(leftNode);

        if (!forceMultiline && rightNodes.length === 1) {
            if (
                !this.preserveMultiline ||
                isLeftRightSingleLine(leftNode, rightNodes)
            ) {
                const rightNode = rightNodes[0];
                if (rightNode.children.length === 1) {
                    const right = this.getNodeText(rightNode.children[0]);
                    const leftWithPadding =
                        this.columnWidth != null
                            ? `${left}: `.padEnd(this.columnWidth)
                            : `${left}: `;
                    if (
                        leftWithPadding.length + right.length <=
                        this.maxLineLength
                    ) {
                        this.lines.push(leftWithPadding + right);
                        return;
                    }
                }
            }
        }

        this.lines.push(`${left}:`);

        for (const n of rightNodes) {
            this.addNode(n, true);
        }
    }
}

function isLeftRightSingleLine(
    left: SyntaxNode,
    rights: SyntaxNode[],
): boolean {
    return left.endPosition.row === rights[rights.length - 1].startPosition.row;
}

function rangeEqual(a: SyntaxNode, b: SyntaxNode): boolean {
    return (
        a.startPosition.row === b.startPosition.row &&
        a.startPosition.column === b.startPosition.column &&
        a.endPosition.row === b.endPosition.row &&
        a.endPosition.column === b.endPosition.column
    );
}

function isFirstChild(node: SyntaxNode): boolean {
    return node.id === node.parent?.children?.[0]?.id;
}

function formatString(node: SyntaxNode): string {
    // Convert single quotes to double quotes
    const text = convertQuotes(node.text);

    // A single string literal is allowed as syntactic sugar for the insert
    // action, but not in combination with other sibling statements.
    if (
        node.parent?.type === "expression_statement" &&
        node.parent.parent?.type === "block" &&
        rangeEqual(node, node.parent) &&
        node.parent.parent.children.length > 1
    ) {
        return `insert(${text})`;
    }

    return text;
}
