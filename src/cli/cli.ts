import * as fs from "node:fs/promises";
import * as process from "node:process";
import type { CLI } from "../types.js";
import { parseArgs } from "../util/parseArgs.js";

export async function main(cli: CLI) {
    try {
        return await mainUnsafe(cli);
    } catch (error) {
        console.error(getErrorMessage(error));
        process.exit(1);
    }
}

async function mainUnsafe(cli: CLI) {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
        printHelp(cli);
        return;
    }

    if (args.check) {
        console.log("Checking formatting...");
    }

    const changedFileCount = await formatFiles(cli, args.fileNames, args.check);

    if (args.check) {
        if (changedFileCount > 0) {
            console.warn(
                `[warn] Code style issues found in ${changedFileCount} file(s).`,
            );
            process.exit(1);
        }

        console.log("All matched files use correct code style!");
        return;
    }

    if (changedFileCount > 0) {
        console.log(`Formatted ${changedFileCount} file(s).`);
    } else {
        console.log("All files are already formatted.");
    }
}

export async function formatFiles(
    cli: CLI,
    fileNames: string[],
    check: boolean = false,
): Promise<number> {
    let changedFileCount = 0;

    for (const fileName of fileNames) {
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
        const formatted = await cli.format(content);

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

function printHelp(cli: CLI) {
    console.log(`Usage: ${cli.binName} [--check] <file> [file ...]`);
}

function isMissingFileError(error: unknown) {
    return (
        typeof error === "object" &&
        error != null &&
        "code" in error &&
        error.code === "ENOENT"
    );
}
