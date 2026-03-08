export function getColumnWidth(
    text: string,
    defaultColumnWidth?: number,
): number | undefined {
    const match = text.match(/# fmt: columnWidth=(\d+)/);
    if (match != null) {
        return parseInt(match[1]);
    }
    return defaultColumnWidth;
}
