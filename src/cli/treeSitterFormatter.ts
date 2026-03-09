#!/usr/bin/env node

import { treeSitterFormatter } from "../lib/treeSitterFormatter.js";
import { parseText } from "../util/parseText.js";
import { main } from "./cli.js";

void main({
    binName: "tree-sitter-fmt",
    fileEndings: ["scm"],
    supportedFlagArgs: ["--indent-tabs"],
    supportedValueArgs: ["--indent-width"],

    format: async (text, options) => {
        const node = await parseText(text, "tree-sitter-query");
        return treeSitterFormatter(node, options);
    },
});
