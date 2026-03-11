import type { KnownArgument, ParsedArgs } from "../types.js";
import { getDefaultArguments } from "./getDefaultArguments.js";

export function parseArgs(argv: string[]): ParsedArgs {
    const result = getDefaultArguments();

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--") {
            // All following arguments are treated as file patterns, even if they start with "--"
            result.filePatterns.push(...argv.slice(i + 1));
            break;
        }

        if (parseKnownArgument(result, arg as KnownArgument)) {
            continue;
        }

        if (arg.startsWith("--")) {
            throw new Error(`Unknown argument: ${arg}`);
        }

        result.filePatterns.push(arg);
    }

    return result;
}

function parseKnownArgument(result: ParsedArgs, arg: KnownArgument): boolean {
    switch (arg) {
        case "--help":
            result.help = true;
            return true;
        case "--version":
            result.version = true;
            return true;
        case "--quiet":
            result.quiet = true;
            return true;
        case "--check":
            result.check = true;
            return true;
        case "--debug":
            result.debug = true;
            return true;
        default:
            return false;
    }
}
