#!/usr/bin/env node

import { talonFormatter } from "../lib/talonFormatter.js";
import { parseText } from "../util/parseText.js";
import { main } from "./cli.js";
import { indentation } from "./constants.js";

void main({
    binName: "talon-fmt",

    format: async (text: string) => {
        const node = await parseText(text, "tree-sitter-talon");
        return talonFormatter(node, { indentation });
    },
});
