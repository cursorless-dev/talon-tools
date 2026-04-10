import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";
import type { Readable } from "node:stream";
import getStdin from "get-stdin";
import type { CLI, Logger, ParsedArgs } from "../types.js";
import { EXIT_ERROR, EXIT_FAIL, EXIT_OK } from "../util/constants.js";
import type { ExitCode } from "../util/constants.js";
import { getErrorMessage } from "../util/getErrorMessage.js";
import { isSyntaxError } from "../util/SyntaxError.js";
import { createLogger } from "./createLogger.js";
import { FilePatternError } from "./FilePatternError.js";
import { getOptionsFromConfig } from "./getOptionsFromConfig.js";
import { isMissingFileError } from "./isMissingFileError.js";
import { normalizeToPosix } from "./normalizeToPosix.js";
import { parseArgs } from "./parseArgs.js";
import { parseFilePatterns } from "./parseFilePatterns.js";
import { printHelp } from "./printHelp.js";
import { printVersion } from "./printVersion.js";
import { setExitCode } from "./setExitCode.js";

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

function mainUnsafe({ cli, args, logger }: MainUnsafeArgs): Promise<ExitCode> {
    if (args.help) {
        printHelp(cli);
        return Promise.resolve(EXIT_OK);
    }

    if (args.version) {
        printVersion();
        return Promise.resolve(EXIT_OK);
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
}: MainFormatFilesArgs): Promise<ExitCode> {
    if (check) {
        logger.log("Checking formatting...");
    }

    const filePaths = await parseFilePatterns(cli, filePatterns);
    const [changedFileCount, hasError] = await formatFiles({
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
            if (!hasError) {
                return EXIT_FAIL;
            }
        }

        if (!hasError) {
            logger.log("All matched files use correct code style!");
        }
    }

    if (hasError) {
        return EXIT_ERROR;
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
}: FormatFilesArgs): Promise<[number, boolean]> {
    let changedFileCount = 0;
    let hasError = false;

    for (const filePath of filePaths) {
        try {
            const fileWasChanged = await formatFile({
                cli,
                logger,
                check,
                debug,
                filePath,
            });
            if (fileWasChanged) {
                changedFileCount++;
            }
        } catch (error) {
            if (isSyntaxError(error)) {
                logger.error(error.getFileMessage(getDisplayPath(filePath)));
            } else {
                logger.error(
                    `${getDisplayPath(filePath)}: ${getErrorMessage(error)}`,
                );
            }
            hasError = true;
        }
    }

    return [changedFileCount, hasError];
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

        throw error;
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
}: MainFormatStdinArgs): Promise<ExitCode> {
    const input = await getStdin({ stdin });
    const fileEnding = cli.getStdinFileEnding(input);
    const fauxFileName = `stdin.${fileEnding}`;
    const fauxFilePath = path.resolve(fauxFileName);
    const options = await getOptionsFromConfig(fauxFilePath);
    let formatted: string;

    try {
        formatted = await cli.format(input, options, fauxFilePath, debug);
    } catch (error) {
        if (isSyntaxError(error)) {
            logger.error(error.getFileMessage("stdin"));
            return EXIT_ERROR;
        }
        throw error;
    }

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
