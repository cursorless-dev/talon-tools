#!/usr/bin/env node

import { talonListFormatter } from "../lib/index.js";
import { talonFormatter } from "../lib/talonFormatter.js";
import { parseText } from "../util/parseText.js";
import { main } from "./cli.js";

void main({
    binName: "talon-fmt",
    fileEndings: ["talon", "talon-list"],

    format: async (text, options, fileName) => {
        if (fileName.endsWith(".talon-list")) {
            const updated = talonListFormatter(text, options);
            return Promise.resolve(updated);
        }

        const node = await parseText(text, "tree-sitter-talon");
        return talonFormatter(node, options);
    },
});
