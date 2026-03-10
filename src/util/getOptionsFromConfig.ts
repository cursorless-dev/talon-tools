import * as editorconfig from "editorconfig";
import type { EditorConfigOptions, Options } from "../types.js";

export async function getOptionsFromConfig(filePath: string): Promise<Options> {
    const config = (await editorconfig.parse(filePath)) as EditorConfigOptions;

    const options: Options = {};

    if (config.indent_style === "tab") {
        options.indentTabs = true;
    } else if (config.indent_style === "space") {
        options.indentTabs = false;
    }

    if (typeof config.indent_size === "number") {
        options.indentSize = config.indent_size;
    } else if (
        config.indent_size === "tab" &&
        typeof config.tab_width === "number"
    ) {
        options.indentSize = config.tab_width;
    }

    if (typeof config.max_line_length === "number") {
        options.maxLineLength = config.max_line_length;
    }

    if (typeof config.column_width === "number") {
        options.columnWidth = config.column_width;
    }

    if (config.end_of_line != null && config.end_of_line !== "unset") {
        options.endOfLine = config.end_of_line;
    }

    return options;
}
