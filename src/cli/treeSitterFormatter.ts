#!/usr/bin/env node

import { treeSitterFormatter } from "../lib/treeSitterFormatter.js";
import { parseText } from "../util/parseText.js";
import { run } from "./cli.js";
import { indentation } from "./constants.js";

void run({
    binName: "tree-sitter-fmt",

    format: async (text: string) => {
        const node = await parseText(text, "tree-sitter-query");
        return treeSitterFormatter(node, { indentation });
    },
});
