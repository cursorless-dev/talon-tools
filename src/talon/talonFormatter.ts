import type { FormatterOptions, SyntaxNode } from "../types.js";
import {
    DEFAULT_INSERT_FINAL_NEWLINE,
    DEFAULT_MAX_LINE_LENGTH,
} from "../util/constants.js";
import { getColumnWidth } from "../util/getColumnWidth.js";
import { getEndOfLine } from "../util/getEndOfLine.js";
import { getIndentation } from "../util/getIndentation.js";

type Options = FormatterOptions<
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
    );
    return formatter.getText(node);
}

class TalonFormatter {
    private lastRow = 0;

    constructor(
        private indent: string,
        private eol: string,
        private maxLineLength: number,
        private columnWidth: number | undefined,
        private insertFinalNewline: boolean,
        private preserveMultiline: boolean,
    ) {}

    getText(node: SyntaxNode): string {
        const nodeText = this.getNodeText(node);

        if (nodeText.length === 0) {
            return "";
        }

        if (this.insertFinalNewline) {
            return nodeText + this.eol;
        }

        return nodeText;
    }

    private getLeftRightText(
        node: SyntaxNode,
        forceMultiline: boolean,
    ): string {
        const [leftNode, _colonNode, ...rightNodes] = node.children;
        const left = this.getNodeText(leftNode);

        if (!forceMultiline && rightNodes.length === 1) {
            if (
                !this.preserveMultiline ||
                isLeftRightSingleLine(leftNode, rightNodes)
            ) {
                const lastRow = this.lastRow;
                const right = this.getNodeText(rightNodes[0]);
                if (!right.includes(this.eol)) {
                    const leftWithPadding =
                        this.columnWidth != null
                            ? `${left}: `.padEnd(this.columnWidth)
                            : `${left}: `;
                    if (
                        leftWithPadding.length + right.length <=
                        this.maxLineLength
                    ) {
                        return leftWithPadding + right;
                    }
                }
                this.lastRow = lastRow;
            }
        }

        const right = rightNodes
            .map((n) => this.getNodeText(n, true))
            .join(this.eol);
        return `${left}:${this.eol}${right}`;
    }

    private getNodeText(node: SyntaxNode, isIndented = false): string {
        const nl = node.startPosition.row > this.lastRow + 1 ? this.eol : "";
        this.lastRow = node.endPosition.row;
        const text = this.getNodeTextInternal(node, isIndented);
        this.lastRow = node.endPosition.row;
        return `${nl}${text}`;
    }

    private pairWithChildren(node: SyntaxNode) {
        const { children } = node;
        const pre = children[0].text;
        const post = children[children.length - 1].text;
        const middle = children
            .slice(1, -1)
            .map((n) => this.getNodeText(n))
            .join(" ");
        return `${pre}${middle}${post}`;
    }

    private getNodeTextInternal(node: SyntaxNode, isIndented = false): string {
        switch (node.type) {
            case "source_file":
                return node.children
                    .map((n) => this.getNodeText(n))
                    .filter(Boolean)
                    .join(this.eol);

            case "matches": {
                if (node.children.length < 2) {
                    return "";
                }
                return node.children
                    .map((n) => this.getNodeText(n))
                    .join(this.eol);
            }

            case "declarations":
                return node.children
                    .map((n) => this.getNodeText(n))
                    .join(this.eol);

            case "match":
                return node.children.map((n) => this.getNodeText(n)).join("");

            case "block":
                return node.children
                    .map((n) => this.getNodeText(n, isIndented))
                    .join(this.eol);

            case "command_declaration":
            case "key_binding_declaration":
            case "parrot_declaration":
            case "noise_declaration":
            case "face_declaration":
            case "gamepad_declaration":
            case "deck_declaration":
                return this.getLeftRightText(node, false);

            case "settings_declaration":
                return this.getLeftRightText(node, true);

            case "comment": {
                // When using crlf eol comments have a trailing `\r`
                const text = node.text.trimEnd();
                return isIndented || node.startPosition.column > 0
                    ? `${this.indent}${text}`
                    : text;
            }

            case "expression_statement":
            case "assignment_statement": {
                const text = node.children
                    .map((n) => this.getNodeText(n))
                    .join(" ");
                return isIndented ? `${this.indent}${text}` : text;
            }

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
                return node.children.map((n) => this.getNodeText(n)).join("");

            case "match_modifier":
            case ":":
            case ",":
                return `${node.text} `;

            case "implicit_string":
                return node.text.trim();

            case "parenthesized_rule":
            case "optional":
                return this.pairWithChildren(node);

            case "seq":
            case "choice":
                return node.children.map((n) => this.getNodeText(n)).join(" ");

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
            case "string":
            case "integer":
            case "float":
            case "start_anchor":
            case "end_anchor":
            case "repeat":
            case "deck(":
            case "(":
            case ")":
            case "=":
            case "-":
            case "|":
                return node.text;

            default:
                console.warn(`Unknown syntax node type '${node.type}'`);
                return node.text;
        }
    }
}

function isLeftRightSingleLine(
    left: SyntaxNode,
    rights: SyntaxNode[],
): boolean {
    return left.endPosition.row === rights[rights.length - 1].startPosition.row;
}
