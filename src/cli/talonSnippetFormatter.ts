#!/usr/bin/env node

import { talonSnippetFormatter } from "../lib/talonSnippetFormatter.js";
import { main } from "./cli.js";

void main({
    binName: "talon-snippet-fmt",

    format: async (text: string) => {
        const updated = talonSnippetFormatter(text);
        return Promise.resolve(updated);
    },
});
