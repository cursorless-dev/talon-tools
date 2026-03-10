import type { Readable } from "node:stream";
import type { CLI } from "../types.js";
export declare function main(cli: CLI): Promise<void>;
export declare function formatFiles(cli: CLI, check: boolean, filePaths: string[]): Promise<number>;
export declare function formatFile(cli: CLI, check: boolean, filePath: string): Promise<boolean>;
export declare function mainFormatStdin(cli: CLI, stdin: Readable, check: boolean): Promise<number>;
