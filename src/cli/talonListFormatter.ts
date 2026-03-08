#!/usr/bin/env node

import { talonListFormatter } from "../lib/talonListFormatter.js";
import { main } from "./cli.js";

void main({
    binName: "talon-list-fmt",

    format: async (text: string) => {
        const updated = talonListFormatter(text, {});
        return Promise.resolve(updated);
    },
});
