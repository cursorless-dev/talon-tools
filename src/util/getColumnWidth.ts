export function getColumnWidth(text: string): number | undefined {
    const match = /# fmt: columnWidth=(\d+)/.exec(text);

    if (match != null) {
        return Number.parseInt(match[1], 10);
    }

    return undefined;
}
