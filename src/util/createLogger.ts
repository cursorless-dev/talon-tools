import * as process from "node:process";
import type { DebugLogger, Logger, LoggerEntry } from "../types.js";

export function createLogger(quiet: boolean = false): Logger {
    const entries: LoggerEntry[] = [];

    return {
        log(message: string) {
            entries.push({ level: "log", message });

            if (!quiet) {
                process.stdout.write(`${message}\n`);
            }
        },
        warn(message: string) {
            entries.push({ level: "warn", message });

            if (!quiet) {
                process.stderr.write(`[warn] ${message}\n`);
            }
        },
        error(message: string) {
            entries.push({ level: "error", message });

            process.stderr.write(`[error] ${message}\n`);
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
