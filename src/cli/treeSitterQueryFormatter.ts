#!/usr/bin/env node

import { treeSitterQueryFormatter } from "../lib/treeSitterQueryFormatter.js";
import { parseText } from "../util/parseText.js";
import { main } from "./cli.js";
import { indentation } from "./constants.js";

void main({
    binName: "tree-sitter-query-fmt",

    format: async (text: string) => {
        const node = await parseText(text, "tree-sitter-query");
        return treeSitterQueryFormatter(node, { indentation });
    },
});
