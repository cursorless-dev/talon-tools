#!/usr/bin/env node

import { talonListFormatter } from "../lib.js";
import { talonFormatter } from "../talon/talonFormatter.js";
import { main } from "./cli.js";
import { parseText } from "./parseText.js";

const fileEndingTalon = "talon";
const fileEndingTalonList = "talon-list";

void main({
    binName: "talon-fmt",
    fileEndings: [fileEndingTalon, fileEndingTalonList],

    getStdinFileEnding(text) {
        return textIsList(text) ? fileEndingTalonList : fileEndingTalon;
    },

    format: async (text, options, filePath, debug) => {
        if (isListFile(text, filePath)) {
            return talonListFormatter(text, options);
        }

        const node = await parseText(text, "tree-sitter-talon");
        return talonFormatter(node, options, debug);
    },
});

function isListFile(text: string, filePath: string): boolean {
    if (filePath.endsWith(".talon")) {
        return false;
    }
    if (filePath.endsWith(".talon-list")) {
        return true;
    }
    return textIsList(text);
}

function textIsList(text: string): boolean {
    return text.trimStart().startsWith("list:");
}
