#!/usr/bin/env node

import { snippetFormatter } from "../snippet/snippetFormatter.js";
import { main } from "./cli.js";

const fileEnding = "snippet";

void main({
    binName: "snippet-fmt",
    fileEndings: [fileEnding],

    getStdinFileEnding() {
        return fileEnding;
    },

    format: async (text, options) => {
        const updated = snippetFormatter(text, options);
        return Promise.resolve(updated);
    },
});
