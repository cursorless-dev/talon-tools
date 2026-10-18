interface TalonListHeader {
    type: "header";
    key: string;
    value: string;
}

interface TalonListItem {
    type: "item";
    key: string;
    // Length 0 = No value and no trailing colon.
    // Length 1 = Single line value. Can be an empty string for trailing colon.
    // Length > 1 = Multiple line value from an indented block. First line is empty string.
    valueLines: string[];
}

interface EmptyLine {
    type: "empty";
}

interface CommentLine {
    type: "comment";
    text: string;
}

export interface TalonList {
    headers: (TalonListHeader | CommentLine)[];
    items: (TalonListItem | CommentLine | EmptyLine)[];
}

export function parseTalonList(text: string): TalonList {
    const lines = text.split(/\r?\n/);
    const separatorIndex = lines.findIndex((line) => /^\s*-\s*$/.test(line));

    if (separatorIndex === -1) {
        throw new Error("Separator not found in talon list");
    }

    const headerLines = lines
        .slice(0, separatorIndex)
        .map((line) => line.trim());
    const bodyLines = trim(lines.slice(separatorIndex + 1));

    const result: TalonList = {
        headers: [],
        items: [],
    };

    for (const line of headerLines) {
        if (line.length === 0) {
            continue;
        }
        if (line.startsWith("#")) {
            result.headers.push({ type: "comment", text: line });
            continue;
        }
        const [key, value] = splitLine(line);
        if (value == null) {
            throw new Error("Header value missing");
        }
        result.headers.push({ type: "header", key, value });
    }

    for (let index = 0; index < bodyLines.length; index++) {
        const line = bodyLines[index].trim();
        if (line.length === 0) {
            result.items.push({ type: "empty" });
            continue;
        }
        if (line.startsWith("#")) {
            result.items.push({ type: "comment", text: line });
            continue;
        }
        const [key, value] = splitLine(line);

        if (value == null) {
            result.items.push({ type: "item", key, valueLines: [] });
            continue;
        }

        const valueLines = [value];

        // value === "" indicates that the following lines may be an indented block.
        if (value === "") {
            const indentedLines = readIndentedLines(bodyLines, index + 1);
            index += indentedLines.length;
            valueLines.push(...indentedLines);
        }

        result.items.push({ type: "item", key, valueLines });
    }

    return result;
}

function readIndentedLines(lines: string[], startIndex: number): string[] {
    let firstNonBlankIndex = startIndex;
    while (
        firstNonBlankIndex < lines.length &&
        lines[firstNonBlankIndex].trim().length === 0
    ) {
        firstNonBlankIndex++;
    }
    const indentation = /^[\t ]+/.exec(lines[firstNonBlankIndex])?.[0];

    if (indentation == null) {
        return [];
    }

    const result: string[] = [];

    for (let index = startIndex; index < lines.length; index++) {
        const line = lines[index];
        if (line.trim().length > 0 && !line.startsWith(indentation)) {
            break;
        }
        result.push(
            index < firstNonBlankIndex ? "" : line.slice(indentation.length),
        );
    }

    // Blank lines after the block belong between items.
    result.length = result.findLastIndex((line) => line.trim().length > 0) + 1;

    return result;
}

function splitLine(line: string): [string, string | undefined] {
    const index = line.indexOf(":");
    if (index === -1) {
        return [line, undefined];
    }
    return [line.slice(0, index).trimEnd(), line.slice(index + 1).trimStart()];
}

function trim(list: string[]): string[] {
    const startIndex = list.findIndex((l) => l.trim().length > 0);
    if (startIndex === -1) {
        return [];
    }
    const endIndex = list.findLastIndex((l) => l.trim().length > 0);
    return list.slice(startIndex, endIndex + 1);
}
