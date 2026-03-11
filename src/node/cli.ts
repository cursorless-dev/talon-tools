import getStdin from "get-stdin";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";
import type { Readable } from "node:stream";
import type { CLI, Logger, ParsedArgs } from "../types.js";
import { EXIT_ERROR, EXIT_FAIL, EXIT_OK } from "../util/constants.js";
import { FilePatternError } from "./FilePatternError.js";
import { getErrorMessage } from "../util/getErrorMessage.js";
import { isMissingFileError } from "./isMissingFileError.js";
import { setExitCode } from "./setExitCode.js";
import { createLogger } from "./createLogger.js";
import { getOptionsFromConfig } from "./getOptionsFromConfig.js";
import { normalizeToPosix } from "./normalizeToPosix.js";
import { parseArgs } from "./parseArgs.js";
import { parseFilePatterns } from "./parseFilePatterns.js";
import { printHelp } from "./printHelp.js";
import { printVersion } from "./printVersion.js";

export async function main(cli: CLI): Promise<void> {
    let logger = createLogger();

    try {
        const args = parseArgs(process.argv.slice(2));
        logger = createLogger(args.quiet);
        const exitCode = await mainUnsafe({ cli, args, logger });
        setExitCode(exitCode);
    } catch (error) {
        if (error instanceof FilePatternError) {
            for (const message of error.messages) {
                logger.error(message);
            }
        } else {
            logger.error(getErrorMessage(error));
        }
        setExitCode(EXIT_ERROR);
    }
}

interface MainUnsafeArgs {
    cli: CLI;
    args: ParsedArgs;
    logger: Logger;
}

async function mainUnsafe({
    cli,
    args,
    logger,
}: MainUnsafeArgs): Promise<number> {
    if (args.help) {
        printHelp(cli);
        return EXIT_OK;
    }

    if (args.version) {
        printVersion();
        return EXIT_OK;
    }

    const hasFilePatterns = args.filePatterns.length > 0;

    if (hasFilePatterns) {
        return mainFormatFiles({
            cli,
            logger,
            check: args.check,
            debug: args.debug,
            filePatterns: args.filePatterns,
        });
    }

    // If no file patterns are provided, check if there's input from stdin.
    // If stdin TTY it's an interactive terminal, so we shouldn't read from it.
    if (!process.stdin.isTTY) {
        return mainFormatStdin({
            cli,
            logger,
            stdin: process.stdin,
            check: args.check,
            debug: args.debug,
        });
    }

    throw new Error(
        "No input files specified. Use --help for usage information.",
    );
}

interface MainFormatFilesArgs {
    cli: CLI;
    logger: Logger;
    check: boolean;
    debug: boolean;
    filePatterns: string[];
}

async function mainFormatFiles({
    cli,
    logger,
    check,
    debug,
    filePatterns,
}: MainFormatFilesArgs): Promise<number> {
    if (check) {
        logger.log("Checking formatting...");
    }

    const filePaths = await parseFilePatterns(cli, filePatterns);
    const changedFileCount = await formatFiles({
        cli,
        logger,
        check,
        debug,
        filePaths,
    });

    if (check) {
        if (changedFileCount > 0) {
            logger.warn(
                `Code style issues found in ${changedFileCount} file(s).`,
            );
            return EXIT_FAIL;
        }

        logger.log("All matched files use correct code style!");
        return EXIT_OK;
    }

    return EXIT_OK;
}

interface FormatFilesArgs {
    cli: CLI;
    logger: Logger;
    check: boolean;
    debug: boolean;
    filePaths: string[];
}

export async function formatFiles({
    cli,
    logger,
    check,
    debug,
    filePaths,
}: FormatFilesArgs): Promise<number> {
    let changedFileCount = 0;

    for (const fileName of filePaths) {
        if (
            await formatFile({
                cli,
                logger,
                check,
                debug,
                filePath: fileName,
            })
        ) {
            changedFileCount++;
        }
    }

    return changedFileCount;
}

interface FormatFileArgs {
    cli: CLI;
    logger: Logger;
    check: boolean;
    debug: boolean;
    filePath: string;
}

export async function formatFile({
    cli,
    logger,
    check,
    debug,
    filePath,
}: FormatFileArgs): Promise<boolean> {
    try {
        const options = await getOptionsFromConfig(filePath);
        const content = await fs.readFile(filePath, "utf8");
        const formatted = await cli.format(content, options, filePath, debug);

        if (formatted === content) {
            return false;
        }

        logger.log(getDisplayPath(filePath));

        if (!check) {
            await fs.writeFile(filePath, formatted, "utf8");
        }

        return true;
    } catch (error) {
        if (isMissingFileError(error)) {
            return false;
        }

        throw new Error(
            `Failed to format '${filePath}': ${getErrorMessage(error)}`,
            {
                cause: error,
            },
        );
    }
}

function getDisplayPath(filePath: string): string {
    return normalizeToPosix(path.relative(process.cwd(), filePath));
}

interface MainFormatStdinArgs {
    cli: CLI;
    logger: Logger;
    stdin: Readable;
    check: boolean;
    debug: boolean;
}

export async function mainFormatStdin({
    cli,
    logger,
    stdin,
    check,
    debug,
}: MainFormatStdinArgs): Promise<number> {
    const input = await getStdin({ stdin });
    const fileEnding = cli.getStdinFileEnding(input);
    const fileName = `stdin.${fileEnding}`;
    const filePath = path.resolve(fileName);
    const options = await getOptionsFromConfig(filePath);
    const formatted = await cli.format(input, options, filePath, debug);

    if (check) {
        if (input !== formatted) {
            logger.warn("Code style issues found in stdin.");
            return EXIT_FAIL;
        }

        return EXIT_OK;
    }

    process.stdout.write(formatted);

    return EXIT_OK;
}
