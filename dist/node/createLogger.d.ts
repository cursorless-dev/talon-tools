import type { WriteStream } from "node:tty";
import type { Logger, TestLogger } from "../types.js";
type LoggerStream = Pick<NodeJS.WriteStream, "write"> & Partial<WriteStream>;
export declare function createLogger(quiet?: boolean): Logger;
export declare function createLoggerFromStreams(stdout: LoggerStream, stderr: LoggerStream, quiet?: boolean): Logger;
export declare function createTestLogger(): TestLogger;
export {};
