import type { Point } from "../types.js";
export declare class SyntaxError extends Error {
    private point?;
    private readonly location;
    constructor(point?: Point | undefined);
    getFileMessage(file: string): string;
}
export declare function isSyntaxError(error: unknown): error is SyntaxError;
