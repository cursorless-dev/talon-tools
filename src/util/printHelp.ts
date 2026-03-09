import { GLOBAL_FLAG_ARGUMENTS } from "../types.js";
import type { CLI } from "../types.js";

export function printHelp(cli: CLI) {
    console.log(`Usage: ${cli.binName} [options] [file/dir/glob ...]`);
    console.log("");
    console.log("Flags:");

    for (const option of GLOBAL_FLAG_ARGUMENTS) {
        console.log(`  ${option}`);
    }

    for (const option of cli.supportedFlagArgs) {
        console.log(`  ${option}`);
    }

    if (cli.supportedValueArgs.length > 0) {
        console.log("");
        console.log("Options:");

        for (const option of cli.supportedValueArgs) {
            console.log(`  ${option} <n>`);
        }
    }
}
