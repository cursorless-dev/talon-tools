import getStdin from "get-stdin";
import * as fs from "node:fs/promises";
import * as process from "node:process";
import type { CLI } from "../types.js";
import { EXIT_ERROR, EXIT_FAIL, EXIT_OK } from "../util/constants.js";
import { parseArgs } from "../util/parseArgs.js";
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
    const args = parseArgs(process.argv.slice(2));

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
        return mainFormatFiles(cli, args.filePatterns, args.check);
    }

    // If no file patterns are provided, check if there's input from stdin.
    // If stdin TTY it's an interactive terminal, so we shouldn't read from it.
    if (!process.stdin.isTTY) {
        return mainFormatStdin(cli, args.check);
    }

    throw new Error(
        "No input files specified. Use --help for usage information.",
    );
}

async function mainFormatStdin(
    cli: CLI,
    check: boolean = false,
): Promise<number> {
    const input = await getStdin();
    const formatted = await cli.format(input, "stdin");

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

async function mainFormatFiles(
    cli: CLI,
    filePatterns: string[],
    check: boolean = false,
): Promise<number> {
    if (check) {
        console.log("Checking formatting...");
    }

    const changedFileCount = await formatFiles(cli, filePatterns, check);

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
    filePatterns: string[],
    check: boolean = false,
): Promise<number> {
    let changedFileCount = 0;

    for (const fileName of filePatterns) {
        if (await formatFile(cli, fileName, check)) {
            changedFileCount++;
        }
    }

    return changedFileCount;
}

export async function formatFile(
    cli: CLI,
    fileName: string,
    check: boolean = false,
): Promise<boolean> {
    try {
        const content = await fs.readFile(fileName, "utf8");
        const formatted = await cli.format(content, fileName);

        if (formatted === content) {
            return false;
        }

        if (check) {
            console.warn(`[warn] ${fileName}`);
        } else {
            console.log(fileName);
            await fs.writeFile(fileName, formatted, "utf8");
        }

        return true;
    } catch (error) {
        if (isMissingFileError(error)) {
            return false;
        }

        throw new Error(
            `Failed to format '${fileName}': ${getErrorMessage(error)}`,
            {
                cause: error,
            },
        );
    }
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isMissingFileError(error: unknown) {
    return (
        typeof error === "object" &&
        error != null &&
        "code" in error &&
        error.code === "ENOENT"
    );
}
