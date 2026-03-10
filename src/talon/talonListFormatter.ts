import type { EndOfLine } from "../types.js";
import { DEFAULT_INSERT_FINAL_NEWLINE } from "../util/constants.js";
import { getColumnWidth } from "../util/getColumnWidth.js";
import { getEndOfLine } from "../util/getEndOfLine.js";
import { parseTalonList } from "./parseTalonList.js";

interface Options {
    readonly endOfLine?: EndOfLine;
    readonly columnWidth?: number;
    readonly insertFinalNewline?: boolean;
}

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
    const result: string[] = [];

    for (const header of talonList.headers) {
        if (header.type === "comment") {
            result.push(header.text);
            continue;
        }
        result.push(`${header.key}: ${header.value}`);
    }

    result.push("-", "");

    for (const item of talonList.items) {
        if (item.type === "empty") {
            result.push("");
            continue;
        }
        if (item.type === "comment") {
            result.push(item.text);
            continue;
        }
        if (item.value != null) {
            const keyWithColon =
                columnWidth != null
                    ? `${item.key}: `.padEnd(columnWidth)
                    : `${item.key}: `;
            result.push(`${keyWithColon}${item.value}`);
        } else {
            result.push(item.key);
        }
    }

    if (result.length === 0) {
        return "";
    }

    if (options.insertFinalNewline ?? DEFAULT_INSERT_FINAL_NEWLINE) {
        result.push("");
    }

    return result.join(eol);
}
