import { DEFAULT_INDENT_WIDTH } from "./constants.js";

export function getIndentation(
    indentTabs: boolean | undefined,
    indentSize: number | undefined,
): string {
    return indentTabs ? "\t" : " ".repeat(indentSize ?? DEFAULT_INDENT_WIDTH);
}
