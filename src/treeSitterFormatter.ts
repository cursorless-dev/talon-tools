import type { DebugLogger, FormatterOptions, SyntaxNode } from "./types.js";
import { DEFAULT_INSERT_FINAL_NEWLINE } from "./util/constants.js";
import { createDebugLogger } from "./util/createDebugLogger.js";
import { getEndOfLine } from "./util/getEndOfLine.js";
import { getIndentation } from "./util/getIndentation.js";
import { SyntaxTreeError } from "./util/SyntaxTreeError.js";

export type Options = FormatterOptions<
    "endOfLine" | "indentTabs" | "indentSize" | "insertFinalNewline"
>;

export function treeSitterFormatter(
    node: SyntaxNode,
    options: Options = {},
    debug = false,
): string {
    if (node.hasError) {
        throw new SyntaxTreeError(node);
    }

    const indentation = getIndentation(options.indentTabs, options.indentSize);
    const eol = getEndOfLine(options.endOfLine);
    const formatter = new TreeSitterFormatter(
        indentation,
        eol,
        options.insertFinalNewline ?? DEFAULT_INSERT_FINAL_NEWLINE,
        debug,
    );
    return formatter.getText(node);
}

class TreeSitterFormatter {
    private lastRow = 0;
    private readonly logger: DebugLogger;

    public constructor(
        private readonly indentation: string,
        private readonly eol: string,
        private readonly insertFinalNewline: boolean,
        debug: boolean,
    ) {
        this.logger = createDebugLogger(debug);
    }

    public getText(node: SyntaxNode): string {
        const nodeText = this.getNodeText(node, 0);

        if (nodeText.length === 0) {
            return "";
        }

        if (this.insertFinalNewline) {
            return nodeText + this.eol;
        }

        return nodeText;
    }

    private getNodeText(node: SyntaxNode, numIndents: number): string {
        const nl = node.startPosition.row > this.lastRow + 1 ? this.eol : "";
        this.lastRow = node.endPosition.row;
        const text = this.getNodeTextInternal(node, numIndents);
        this.lastRow = node.endPosition.row;
        return `${nl}${text}`;
    }

    private getNamedNodeText(node: SyntaxNode, numIndents: number): string {
        const index = node.children.findLastIndex((n) => n.type === ")");
        const first = node.children
            .slice(0, 2)
            .map((n) => n.text)
            .join("");
        const last = node.children
            .slice(index)
            .map((n) => this.getNodeText(n, 0))
            .join("");
        const interior = node.children
            .slice(2, index)
            .map((n) => this.getNodeText(n, numIndents + 1));
        // Inline node
        if (interior.length === 0) {
            return `${this.getIndent(numIndents)}${first}${last}`;
        }
        // Multiline node
        return [
            `${this.getIndent(numIndents)}${first}`,
            ...interior,
            `${this.getIndent(numIndents)}${last}`,
        ].join(this.eol);
    }

    private getVerticalPairNodeText(
        node: SyntaxNode,
        closingDelimiter: string,
        numIndents: number,
    ): string {
        const index = node.children.findLastIndex(
            (n) => n.type === closingDelimiter,
        );
        if (index === -1) {
            throw new Error(
                `Closing delimiter "${closingDelimiter}" not found in node ${node.type}`,
            );
        }
        const first = node.children[0].text;
        const middle = node.children.slice(1, index);
        const last = node.children
            .slice(index)
            .map((n, i) =>
                i > 0 && n.type !== "quantifier" ? ` ${n.text}` : n.text,
            )
            .join("");
        const parts = [
            `${this.getIndent(numIndents)}${first}`,
            ...middle.map((n) => this.getNodeText(n, numIndents + 1)),
            `${this.getIndent(numIndents)}${last}`,
        ];
        return parts.join(this.eol);
    }

    private getPredicateText(node: SyntaxNode, numIndents: number): string {
        const first = node.children[0].text;
        const last = node.children[node.children.length - 1].text;
        const parts = [
            node.children
                .slice(1, 4)
                .map((n) => n.text)
                .join(""),
            ...node.children[node.children.length - 2].children.map(
                (n) => n.text,
            ),
        ];
        // Inline predicate
        if (node.startPosition.row === node.endPosition.row) {
            const text = `${first}${parts.join(" ")}${last}`;
            return `${this.getIndent(numIndents)}${text}`;
        }
        // Multiline predicate
        return [
            `${this.getIndent(numIndents)}${first}${parts[0]}`,
            ...parts
                .slice(1)
                .map((s) => `${this.getIndent(numIndents + 1)}${s}`),
            `${this.getIndent(numIndents)}${last}`,
        ].join(this.eol);
    }

    private getFieldDefinitionText(
        node: SyntaxNode,
        numIndents: number,
    ): string {
        // Field definition directly in document root
        if (numIndents === 0) {
            return ["(_", this.getFieldDefinitionText(node, 1), ")"].join(
                this.eol,
            );
        }
        // [lhs, ":", rhs]
        return [
            this.getIndent(numIndents),
            node.children[0].text,
            node.children[1].text,
            " ",
            this.getNodeText(node.children[2], numIndents).trimStart(),
        ].join("");
    }

    private getNodeTextInternal(node: SyntaxNode, numIndents: number): string {
        // console.log(node.type, node.text);
        switch (node.type) {
            case "program":
                return node.children
                    .map((n) => this.getNodeText(n, numIndents))
                    .join(this.eol);

            case "grouping":
                return this.getVerticalPairNodeText(node, ")", numIndents);

            case "list":
                return this.getVerticalPairNodeText(node, "]", numIndents);

            case "named_node":
                return this.getNamedNodeText(node, numIndents);

            case "predicate":
                return this.getPredicateText(node, numIndents);

            case "field_definition":
                return this.getFieldDefinitionText(node, numIndents);

            case "anonymous_node":
                return (
                    this.getIndent(numIndents) +
                    node.children
                        .map((n) => this.getNodeText(n, numIndents + 1))
                        .join("")
                );

            case "comment":
                return `${this.getIndent(numIndents)}${node.text.trimEnd()}`;

            case ".":
            case "negated_field":
                return `${this.getIndent(numIndents)}${node.text}`;

            case "(":
            case ")":
                return `${this.getIndent(numIndents - 1)}${node.text}`;

            case "capture":
                return ` ${node.text}`;

            case "#":
            case "_":
            case "predicate_type":
            case "identifier":
            case "quantifier":
            case "string":
                return node.text;

            case "parameters": {
                const text = node.children.map((n) => n.text).join(" ");
                return ` ${text}`;
            }

            default:
                this.logger.debug(`Unknown syntax node type '${node.type}'`);
                return node.text;
        }
    }

    private getIndent(length: number): string {
        return length < 1
            ? ""
            : Array.from({ length }, () => this.indentation).join("");
    }
}
