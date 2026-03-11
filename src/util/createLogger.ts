import * as process from "node:process";
import type { DebugLogger, Logger, LoggerEntry, TestLogger } from "../types.js";

type LogCallback = (message: string) => void;

export function createLogger(quiet: boolean = false): Logger {
    let log: LogCallback;
    let warn: LogCallback;

    if (quiet) {
        log = () => {};
        warn = () => {};
    } else {
        log = (message: string) => {
            process.stdout.write(`${message}\n`);
        };
        warn = (message: string) => {
            process.stderr.write(`[warn] ${message}\n`);
        };
    }

    return {
        log,
        warn,
        error(message: string) {
            process.stderr.write(`[error] ${message}\n`);
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

export function createDebugLogger(debug: boolean): DebugLogger {
    return {
        debug(message: string) {
            if (debug) {
                process.stderr.write(`[debug] ${message}\n`);
            }
        },
    };
}
