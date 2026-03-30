import type { Point } from "../types.js";

export class SyntaxError extends Error {
    constructor(private location?: Point) {
        super("Syntax error.");
        this.name = "SyntaxError";
    }

    getLocation(): string | undefined {
        return this.location != null
            ? `(${this.location.row + 1}:${this.location.column + 1})`
            : undefined;
    }
}

export function isSyntaxError(error: unknown): error is SyntaxError {
    return error instanceof SyntaxError;
}
