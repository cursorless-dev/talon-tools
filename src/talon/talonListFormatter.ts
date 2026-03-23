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
            const value = formatValue(item.value);
            result.push(`${keyWithColon}${value}`);
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

function formatValue(value: string): string {
    if (value.length >= 2) {
        const first = value[0];

        if (
            (first === '"' || first === "'") &&
            value[value.length - 1] === first
        ) {
            const innerValue = value.slice(1, -1).trim();

            if (
                innerValue.length > 0 &&
                innerValue.length + 2 === value.length &&
                !innerValue.includes(first === '"' ? "'" : '"')
            ) {
                return innerValue;
            }

            return convertQuotes(value);
        }
    }

    return value;
}
