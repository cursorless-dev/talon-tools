import type { Options } from "../types.js";

export function getIndentation(options: Options): string {
    return options.indentTabs ? "\t" : " ".repeat(options.indentWidth);
}
