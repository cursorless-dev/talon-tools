import type { CLI } from "../types.js";
import { KNOWN_ARGUMENTS } from "../types.js";

export function printHelp(cli: CLI) {
    process.stdout.write(
        `Usage: ${cli.binName} [options] [file/dir/glob ...]\n`,
    );
    process.stdout.write("\n");
    process.stdout.write("Options:\n");

    for (const option of KNOWN_ARGUMENTS) {
        process.stdout.write(`  ${option}\n`);
    }
}
