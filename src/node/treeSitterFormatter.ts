#!/usr/bin/env node

import { treeSitterFormatter } from "../treeSitterFormatter.js";
import { main } from "./cli.js";
import { parseText } from "./parseText.js";

const fileEnding = "scm";

void main({
    binName: "tree-sitter-fmt",
    fileEndings: [fileEnding],

    getStdinFileEnding() {
        return fileEnding;
    },

    format: async (text, options, _filePath, debug) => {
        const node = await parseText(text, "tree-sitter-query");
        return treeSitterFormatter(node, options, debug);
    },
});
