#!/usr/bin/env node

import { talonListFormatter } from "../lib/index.js";
import { talonFormatter } from "../lib/talonFormatter.js";
import { parseText } from "../util/parseText.js";
import { main } from "./cli.js";
import { indentation } from "./constants.js";

void main({
    binName: "talon-fmt",

    format: async (text: string, fileName: string) => {
        if (fileName.endsWith(".talon-list")) {
            const updated = talonListFormatter(text, {});
            return Promise.resolve(updated);
        }

        const node = await parseText(text, "tree-sitter-talon");
        return talonFormatter(node, { indentation });
    },
});
