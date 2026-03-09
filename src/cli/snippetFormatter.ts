#!/usr/bin/env node

import { snippetFormatter } from "../lib/snippetFormatter.js";
import { main } from "./cli.js";

void main({
    binName: "snippet-fmt",

    format: async (text: string) => {
        const updated = snippetFormatter(text);
        return Promise.resolve(updated);
    },
});
