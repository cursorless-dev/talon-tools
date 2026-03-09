import type { ParsedArgs } from "../types.js";

export function getDefaultArguments(): ParsedArgs {
    return {
        filePatterns: [],
        help: false,
        version: false,
        check: false,
    };
}
