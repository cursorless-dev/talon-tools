#!/usr/bin/env node

import { treeSitterFormatter } from "../lib/treeSitterFormatter.js";
import { parseText } from "../util/parseText.js";
import { main } from "./cli.js";
import { indentation } from "../util/constants.js";

void main({
    binName: "tree-sitter-fmt",
    fileEndings: ["scm"],

    format: async (text: string) => {
        const node = await parseText(text, "tree-sitter-query");
        return treeSitterFormatter(node, { indentation });
    },
});
