#!/usr/bin/env node

import { talonListFormatter } from "../lib/index.js";
import { talonFormatter } from "../lib/talonFormatter.js";
import { parseText } from "../util/parseText.js";
import { main } from "./cli.js";

const fileEndingTalon = "talon";
const fileEndingTalonList = "talon-list";

void main({
    binName: "talon-fmt",
    fileEndings: [fileEndingTalon, fileEndingTalonList],

    getStdinFileEnding(text) {
        return textIsList(text) ? fileEndingTalonList : fileEndingTalon;
    },

    format: async (text, options, filePath) => {
        if (isListFile(text, filePath)) {
            const updated = talonListFormatter(text, options);
            return Promise.resolve(updated);
        }

        const node = await parseText(text, "tree-sitter-talon");
        return talonFormatter(node, options);
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
    return text.startsWith("list:");
}
