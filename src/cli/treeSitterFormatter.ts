#!/usr/bin/env node

import { treeSitterFormatter } from "../lib/treeSitterFormatter.js";
import { parseText } from "../util/parseText.js";
import { main } from "./cli.js";
import { indentation } from "./constants.js";

void main({
    binName: "tree-sitter-fmt",

    format: async (text: string) => {
        const node = await parseText(text, "tree-sitter-query");
        return treeSitterFormatter(node, { indentation });
    },
});
