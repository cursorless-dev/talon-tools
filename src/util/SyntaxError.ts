import type { Point } from "../types.js";

const shortMessage = "Syntax error";

export class SyntaxError extends Error {
    private readonly location: string | undefined;

    constructor(private readonly point?: Point) {
        const location = getLocation(point);
        super(getMessage(location));
        this.name = "SyntaxError";
        this.location = location;
    }

    getFileMessage(file: string): string {
        return this.location != null
            ? `${file}(${this.location}): ${shortMessage}`
            : `${file}: ${shortMessage}`;
    }
}

export function isSyntaxError(error: unknown): error is SyntaxError {
    return error instanceof SyntaxError;
}

function getMessage(location: string | undefined): string {
    return location != null ? `${shortMessage} at ${location}.` : shortMessage;
}

function getLocation(point: Point | undefined): string | undefined {
    return point != null ? `${point.row + 1}:${point.column + 1}` : undefined;
}
