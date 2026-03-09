import type { CLI } from "../types.js";
import { KNOWN_ARGUMENTS } from "./parseArgs.js";

export function printHelp(cli: CLI) {
    const args = KNOWN_ARGUMENTS.join("|");
    console.log(`Usage: ${cli.binName} [${args}] [file/dir/glob ...]`);
}
