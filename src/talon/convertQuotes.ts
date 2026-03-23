export function convertQuotes(text: string): string {
    // Convert single quotes to double quotes
    if (
        text.length > 0 &&
        text[0] === "'" &&
        text[text.length - 1] === "'" &&
        !text.includes('"')
    ) {
        const innerText = text.slice(1, -1).replaceAll("\\'", "'");
        return `"${innerText}"`;
    }

    return text;
}
