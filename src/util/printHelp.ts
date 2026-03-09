import type { CLI } from "../types.js";
import { KNOWN_ARGUMENTS } from "../types.js";

export function printHelp(cli: CLI) {
    console.log(`Usage: ${cli.binName} [options] [file/dir/glob ...]`);
    console.log("");
    console.log("Options:");

    for (const option of KNOWN_ARGUMENTS) {
        console.log(`  ${option}`);
    }
}
