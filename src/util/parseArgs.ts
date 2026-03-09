/* eslint-disable @typescript-eslint/naming-convention */

import type { ParsedArgs } from "../types.js";

export const KNOWN_ARGUMENTS = ["--help", "--check"] as const;

type KnownArgument = (typeof KNOWN_ARGUMENTS)[number];
type ArgHandler = (parsedArgs: ParsedArgs) => void;

const ARG_HANDLERS: Record<KnownArgument, ArgHandler> = {
    "--help": (parsedArgs) => {
        parsedArgs.help = true;
    },
    "--check": (parsedArgs) => {
        parsedArgs.check = true;
    },
};

export function parseArgs(argv: string[]): ParsedArgs {
    const result: ParsedArgs = {
        filePatterns: [],
        help: false,
        check: false,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--") {
            // All following arguments are treated as file patterns, even if they start with "--"
            result.filePatterns.push(...argv.slice(i + 1));
            break;
        }

        const handler = ARG_HANDLERS[arg as KnownArgument];

        if (handler != null) {
            handler(result);
            continue;
        }

        if (arg.startsWith("--")) {
            throw new Error(`Unknown argument: ${arg}`);
        }

        result.filePatterns.push(arg);
    }

    return result;
}
