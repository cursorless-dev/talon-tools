#!/usr/bin/env node

import { snippetFormatter } from "../lib/snippetFormatter.js";
import { run } from "./cli.js";

void run({
    binName: "snippet-fmt",

    format: async (text: string) => {
        const updated = snippetFormatter(text);
        return Promise.resolve(updated);
    },
});
