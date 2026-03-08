import type { ParsedArgs } from "../types.js";

export function parseArgs(argv: string[]): ParsedArgs {
    let help = false;
    let check = false;
    const fileNames: string[] = [];

    for (const arg of argv) {
        if (arg === "--") {
            fileNames.push(...argv.slice(argv.indexOf(arg) + 1));
            break;
        }

        if (arg === "--help" || arg === "-h") {
            help = true;
            continue;
        }

        if (arg === "--check") {
            check = true;
            continue;
        }

        if (arg.startsWith("-")) {
            throw new Error(`Unknown argument: ${arg}`);
        }

        fileNames.push(arg);
    }

    return { fileNames, help, check };
}
