import { getColumnWidth } from "../util/getColumnWidth.js";
import { parseTalonList } from "./parseTalonList.js";

interface Properties {
    columnWidth?: number;
}

export function talonListFormatter(text: string, props: Properties): string {
    const columnWidth = getColumnWidth(text, props.columnWidth);
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

    result.push("");

    return result.join("\n");
}
