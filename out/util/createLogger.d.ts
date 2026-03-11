import type { DebugLogger, Logger, TestLogger } from "../types.js";
export declare function createLogger(quiet?: boolean): Logger;
export declare function createTestLogger(): TestLogger;
export declare function createDebugLogger(debug: boolean): DebugLogger;
