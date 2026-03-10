import type { Readable } from "node:stream";
import type { CLI, Logger } from "../types.js";
export declare function main(cli: CLI): Promise<void>;
interface FormatFilesArgs {
    cli: CLI;
    logger: Logger;
    check: boolean;
    debug: boolean;
    filePaths: string[];
}
export declare function formatFiles({ cli, logger, check, debug, filePaths, }: FormatFilesArgs): Promise<number>;
interface FormatFileArgs {
    cli: CLI;
    logger: Logger;
    check: boolean;
    debug: boolean;
    filePath: string;
}
export declare function formatFile({ cli, logger, check, debug, filePath, }: FormatFileArgs): Promise<boolean>;
interface MainFormatStdinArgs {
    cli: CLI;
    logger: Logger;
    stdin: Readable;
    check: boolean;
    debug: boolean;
}
export declare function mainFormatStdin({ cli, logger, stdin, check, debug, }: MainFormatStdinArgs): Promise<number>;
export {};
