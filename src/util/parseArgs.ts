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
        fileNames: [],
        help: false,
        check: false,
    };

    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index];

        if (arg === "--") {
            result.fileNames.push(...argv.slice(index + 1));
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

        result.fileNames.push(arg);
    }

    return result;
}
