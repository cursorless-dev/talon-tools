/* eslint-disable @typescript-eslint/naming-convention */

import type { ParsedArgs } from "../types.js";
import { getDefaultArguments } from "./getDefaultArguments.js";

export const KNOWN_FLAG_ARGUMENTS = [
    "--help",
    "--version",
    "--check",
    "--indent-tabs",
] as const;

export const KNOWN_VALUE_ARGUMENTS = [
    "--indent-width",
    "--line-width",
    "--column-width",
] as const;

type FlagArg = (typeof KNOWN_FLAG_ARGUMENTS)[number];
type ValueArg = (typeof KNOWN_VALUE_ARGUMENTS)[number];
type KnownArg = FlagArg | ValueArg;

type FlagHandler = (parsedArgs: ParsedArgs) => void;

type ValueHandler = (
    parsedArgs: ParsedArgs,
    argName: KnownArg,
    value: string,
) => void;

const FLAG_ARG_HANDLERS: Record<FlagArg, FlagHandler> = {
    "--help": (parsedArgs) => {
        parsedArgs.help = true;
    },
    "--version": (parsedArgs) => {
        parsedArgs.version = true;
    },
    "--check": (parsedArgs) => {
        parsedArgs.check = true;
    },
    "--indent-tabs": (parsedArgs) => {
        parsedArgs.indentTabs = true;
    },
};

const VALUE_ARG_HANDLERS: Record<ValueArg, ValueHandler> = {
    "--indent-width": (parsedArgs, argName, value) => {
        parsedArgs.indentWidth = parsePositiveInteger(argName, value);
    },
    "--line-width": (parsedArgs, argName, value) => {
        parsedArgs.lineWidth = parsePositiveInteger(argName, value);
    },
    "--column-width": (parsedArgs, argName, value) => {
        parsedArgs.columnWidth = parsePositiveInteger(argName, value);
    },
};

export function parseArgs(argv: string[]): ParsedArgs {
    const result = getDefaultArguments();

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--") {
            // All following arguments are treated as file patterns, even if they start with "--"
            result.filePatterns.push(...argv.slice(i + 1));
            break;
        }

        const flagHandler = FLAG_ARG_HANDLERS[arg as FlagArg];

        if (flagHandler != null) {
            flagHandler(result);
            continue;
        }

        const valueHandler = VALUE_ARG_HANDLERS[arg as ValueArg];

        if (valueHandler != null) {
            const value = argv[i + 1];
            if (value == null) {
                throw new Error(`Missing value for argument: ${arg}`);
            }
            valueHandler(result, arg as ValueArg, value);
            i++;
            continue;
        }

        if (arg.startsWith("--")) {
            throw new Error(`Unknown argument: ${arg}`);
        }

        result.filePatterns.push(arg);
    }

    return result;
}

function parsePositiveInteger(argName: KnownArg, value: string): number {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid value for ${argName}: ${value}`);
    }

    return parsed;
}
