import type { FormatterOptions } from "../types.js";
import { DEFAULT_INSERT_FINAL_NEWLINE } from "../util/constants.js";
import { getColumnWidth } from "../util/getColumnWidth.js";
import { getEndOfLine } from "../util/getEndOfLine.js";
import { getIndentation } from "../util/getIndentation.js";
import { convertQuotes } from "./convertQuotes.js";
import { parseTalonList } from "./parseTalonList.js";

type Options = FormatterOptions<
    | "endOfLine"
    | "indentTabs"
    | "indentSize"
    | "columnWidth"
    | "insertFinalNewline"
>;

export function talonListFormatter(
    text: string,
    options: Options = {},
): string {
    const columnWidth = getColumnWidth(text) ?? options.columnWidth;
    const eol = getEndOfLine(options.endOfLine);
    const indentation = getIndentation(options.indentTabs, options.indentSize);
    const talonList = parseTalonList(text);
    talonList.headers.sort((a, _b) =>
        a.type === "header" && a.key === "list" ? -1 : 0,
    );
    const lines: string[] = [];

    for (const header of talonList.headers) {
        if (header.type === "comment") {
            lines.push(header.text);
            continue;
        }
        lines.push(`${header.key}: ${header.value}`);
    }

    lines.push("-", "");

    for (const item of talonList.items) {
        if (item.type === "empty") {
            lines.push("");
            continue;
        }
        if (item.type === "comment") {
            lines.push(item.text);
            continue;
        }
        // Empty value lines means there is no colon after the key.
        if (item.valueLines.length === 0) {
            lines.push(item.key);
        }
        // Non-empty value lines means there is a colon and possibly indented content after the key.
        else {
            const [firstValue, ...indentedValues] = item.valueLines;
            let keyWithColon: string;

            if (firstValue === "") {
                keyWithColon = `${item.key}:`;
            } else {
                keyWithColon =
                    columnWidth == null
                        ? `${item.key}: `
                        : `${item.key}: `.padEnd(columnWidth);
            }
            const value = convertQuotes(firstValue);
            lines.push(`${keyWithColon}${value}`);
            for (const indentedValue of indentedValues) {
                lines.push(
                    indentedValue.length === 0
                        ? ""
                        : `${indentation}${indentedValue}`,
                );
            }
        }
    }

    if (lines.length === 0) {
        return "";
    }

    if (options.insertFinalNewline ?? DEFAULT_INSERT_FINAL_NEWLINE) {
        lines.push("");
    }

    return lines.join(eol);
}
