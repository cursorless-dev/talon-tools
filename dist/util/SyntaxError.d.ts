import type { Point } from "../types.js";
export declare class SyntaxError extends Error {
    private location?;
    constructor(location?: Point | undefined);
    getLocation(): string | undefined;
}
export declare function isSyntaxError(error: unknown): error is SyntaxError;
