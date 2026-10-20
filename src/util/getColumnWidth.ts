export function getColumnWidth(text: string): number | undefined {
    const match = /# fmt: columnWidth=(\d+)/u.exec(text);

    if (match != null) {
        return Math.trunc(Number(match[1]));
    }

    return undefined;
}
