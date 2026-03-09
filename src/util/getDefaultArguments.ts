import type { ParsedArgs } from "../types.js";

export function getDefaultArguments(): ParsedArgs {
    return {
        filePatterns: [],
        help: false,
        version: false,
        check: false,
        indentTabs: false,
        indentWidth: 4,
        lineWidth: 80,
        columnWidth: undefined,
    };
}
