import type { DebugLogger } from "../types.js";

export function createDebugLogger(debug: boolean): DebugLogger {
    return {
        debug(message: string) {
            if (debug) {
                console.warn(`[debug] ${message}`);
            }
        },
    };
}
