import type { FormatterOptions } from "../types.js";
import { DEFAULT_INSERT_FINAL_NEWLINE } from "../util/constants.js";
import { getColumnWidth } from "../util/getColumnWidth.js";
import { getEndOfLine } from "../util/getEndOfLine.js";
import { convertQuotes } from "./convertQuotes.js";
import { parseTalonList } from "./parseTalonList.js";

type Options = FormatterOptions<
    "endOfLine" | "columnWidth" | "insertFinalNewline"
>;

export function talonListFormatter(
    text: string,
    options: Options = {},
): string {
    const columnWidth = getColumnWidth(text) ?? options.columnWidth;
    const eol = getEndOfLine(options.endOfLine);
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
        if (item.value != null) {
            const keyWithColon =
                columnWidth != null
                    ? `${item.key}: `.padEnd(columnWidth)
                    : `${item.key}: `;
            const value = convertQuotes(item.value);
            lines.push(`${keyWithColon}${value}`);
        } else {
            lines.push(item.key);
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
