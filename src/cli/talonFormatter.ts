#!/usr/bin/env node

import { talonListFormatter } from "../lib/index.js";
import { talonFormatter } from "../lib/talonFormatter.js";
import { parseText } from "../util/parseText.js";
import { main } from "./cli.js";

void main({
    binName: "talon-fmt",
    fileEndings: ["talon", "talon-list"],
    supportedFlagArgs: ["--indent-tabs"],
    supportedValueArgs: ["--indent-width", "--column-width"],

    format: async (text, options, fileName) => {
        if (isListFile(text, fileName)) {
            const updated = talonListFormatter(text, options);
            return Promise.resolve(updated);
        }

        const node = await parseText(text, "tree-sitter-talon");
        return talonFormatter(node, options);
    },
});

function isListFile(text: string, fileName: string): boolean {
    if (fileName.endsWith(".talon-list")) {
        return true;
    }
    if (fileName.endsWith(".talon")) {
        return false;
    }
    return text.startsWith("list:");
}
