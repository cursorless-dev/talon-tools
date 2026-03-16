import * as process from "node:process";
import type { WriteStream } from "node:tty";
import type { Logger, LoggerEntry, TestLogger } from "../types.js";

type LogCallback = (message: string) => void;
type ColorizeCallback = (message: string, color: string) => string;
type LoggerStream = Pick<NodeJS.WriteStream, "write"> & Partial<WriteStream>;

const ANSI_RESET = "\u001b[0m";
const ANSI_YELLOW = "\u001b[33m";
const ANSI_RED = "\u001b[31m";
const WARN_PREFIX = "[warn]";
const ERROR_PREFIX = "[error]";

export function createLogger(quiet: boolean = false): Logger {
    return createLoggerFromStreams(process.stdout, process.stderr, quiet);
}

export function createLoggerFromStreams(
    stdout: LoggerStream,
    stderr: LoggerStream,
    quiet: boolean = false,
): Logger {
    const colorize: ColorizeCallback = shouldUseColor(stderr)
        ? (message, color) => `${color}${message}${ANSI_RESET}`
        : (message, _color) => message;

    let log: LogCallback;
    let warn: LogCallback;

    if (quiet) {
        log = () => {};
        warn = () => {};
    } else {
        log = (message: string) => {
            stdout.write(`${message}\n`);
        };
        warn = (message: string) => {
            stderr.write(`${colorize(WARN_PREFIX, ANSI_YELLOW)} ${message}\n`);
        };
    }

    return {
        log,
        warn,
        error(message: string) {
            stderr.write(`${colorize(ERROR_PREFIX, ANSI_RED)} ${message}\n`);
        },
    };
}

export function createTestLogger(): TestLogger {
    const entries: LoggerEntry[] = [];

    return {
        log(message: string) {
            entries.push({ level: "log", message });
        },
        warn(message: string) {
            entries.push({ level: "warn", message });
        },
        error(message: string) {
            entries.push({ level: "error", message });
        },
        getEntries() {
            return entries;
        },
    };
}

function shouldUseColor(stream: LoggerStream): boolean {
    if ("NO_COLOR" in process.env) {
        return false;
    }

    return stream.isTTY === true;
}
