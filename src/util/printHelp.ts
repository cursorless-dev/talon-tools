import type { CLI } from "../types.js";
import { KNOWN_FLAG_ARGUMENTS, KNOWN_VALUE_ARGUMENTS } from "./parseArgs.js";

export function printHelp(cli: CLI) {
    console.log(`Usage: ${cli.binName} [options] [file/dir/glob ...]`);
    console.log("");
    console.log("Flags:");

    for (const option of KNOWN_FLAG_ARGUMENTS) {
        console.log(`  ${option}`);
    }

    console.log("");
    console.log("Options:");

    for (const option of KNOWN_VALUE_ARGUMENTS) {
        console.log(`  ${option} <n>`);
    }
}
