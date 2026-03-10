#!/usr/bin/env node

import { treeSitterFormatter } from "../treeSitterFormatter.js";
import { parseText } from "../util/parseText.js";
import { main } from "./cli.js";

const fileEnding = "scm";

void main({
    binName: "tree-sitter-fmt",
    fileEndings: [fileEnding],

    getStdinFileEnding() {
        return fileEnding;
    },

    format: async (text, options) => {
        const node = await parseText(text, "tree-sitter-query");
        return treeSitterFormatter(node, options);
    },
});
