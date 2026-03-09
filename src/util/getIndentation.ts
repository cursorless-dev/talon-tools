import { DEFAULT_INDENT_WIDTH } from "./constants.js";

export function getIndentation(
    indentTabs: boolean | undefined,
    indentWidth: number | undefined,
): string {
    return indentTabs ? "\t" : " ".repeat(indentWidth ?? DEFAULT_INDENT_WIDTH);
}
