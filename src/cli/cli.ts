import getStdin from "get-stdin";
import * as fs from "node:fs/promises";
import * as process from "node:process";
import type { Readable } from "node:stream";
import type { CLI, Options } from "../types.js";
import { EXIT_ERROR, EXIT_FAIL, EXIT_OK } from "../util/constants.js";
import { getErrorMessage } from "../util/getErrorMessage.js";
import { isMissingFileError } from "../util/isMissingFileError.js";
import { parseArgs } from "../util/parseArgs.js";
import { parseFilePatterns } from "../util/parseFilePatterns.js";
import { printHelp } from "../util/printHelp.js";
import { printVersion } from "../util/printVersion.js";

export async function main(cli: CLI): Promise<void> {
    try {
        const exitCode = await mainUnsafe(cli);
        process.exit(exitCode);
    } catch (error) {
        console.error(getErrorMessage(error));
        process.exit(EXIT_ERROR);
    }
}

async function mainUnsafe(cli: CLI): Promise<number> {
    const args = parseArgs(cli, process.argv.slice(2));

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
        return mainFormatFiles(cli, args.check, args, args.filePatterns);
    }

    // If no file patterns are provided, check if there's input from stdin.
    // If stdin TTY it's an interactive terminal, so we shouldn't read from it.
    if (!process.stdin.isTTY) {
        return mainFormatStdin(cli, process.stdin, args.check, args);
    }

    throw new Error(
        "No input files specified. Use --help for usage information.",
    );
}

async function mainFormatFiles(
    cli: CLI,
    check: boolean,
    options: Options,
    filePatterns: string[],
): Promise<number> {
    if (check) {
        console.log("Checking formatting...");
    }

    const filePaths = await parseFilePatterns(cli, filePatterns);
    const changedFileCount = await formatFiles(cli, check, options, filePaths);

    if (check) {
        if (changedFileCount > 0) {
            console.warn(
                `[warn] Code style issues found in ${changedFileCount} file(s).`,
            );
            return EXIT_FAIL;
        }

        console.log("All matched files use correct code style!");
        return EXIT_OK;
    }

    if (changedFileCount > 0) {
        console.log(`Formatted ${changedFileCount} file(s).`);
    } else {
        console.log("All files are already formatted.");
    }

    return EXIT_OK;
}

export async function formatFiles(
    cli: CLI,
    check: boolean,
    options: Options,
    filePaths: string[],
): Promise<number> {
    let changedFileCount = 0;

    for (const fileName of filePaths) {
        if (await formatFile(cli, check, options, fileName)) {
            changedFileCount++;
        }
    }

    return changedFileCount;
}

export async function formatFile(
    cli: CLI,
    check: boolean,
    options: Options,
    filePath: string,
): Promise<boolean> {
    try {
        const content = await fs.readFile(filePath, "utf8");
        const formatted = await cli.format(content, options, filePath);

        if (formatted === content) {
            return false;
        }

        if (check) {
            console.warn(`[warn] ${filePath}`);
        } else {
            console.log(filePath);
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

export async function mainFormatStdin(
    cli: CLI,
    stdin: Readable,
    check: boolean,
    options: Options,
): Promise<number> {
    const input = await getStdin({ stdin });
    const formatted = await cli.format(input, options, "stdin");

    if (check) {
        if (input !== formatted) {
            process.stderr.write("[warn] Code style issues found in stdin.");
            return EXIT_FAIL;
        }

        return EXIT_OK;
    }

    process.stdout.write(formatted);

    return EXIT_OK;
}
