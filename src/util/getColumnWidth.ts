export function getColumnWidth(text: string): number | undefined {
    const match = text.match(/# fmt: columnWidth=(\d+)/);

    if (match != null) {
        return parseInt(match[1], 10);
    }

    return undefined;
}
