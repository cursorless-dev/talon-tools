export function convertQuotes(text: string): string {
    // Convert single quotes to double quotes
    if (
        text.length > 0 &&
        text.startsWith("'") &&
        text.endsWith("'") &&
        !text.includes('"')
    ) {
        const innerText = text.slice(1, -1).replaceAll(String.raw`\'`, "'");
        return `"${innerText}"`;
    }

    return text;
}
