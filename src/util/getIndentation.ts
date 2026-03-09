export function getIndentation(
    indentTabs: boolean | undefined,
    indentWidth: number | undefined,
): string {
    return indentTabs ? "\t" : " ".repeat(indentWidth ?? 4);
}
