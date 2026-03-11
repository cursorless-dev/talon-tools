import type { Options } from "fast-glob";
import fastGlob from "fast-glob";
import * as path from "node:path";
import type { CLI } from "../types.js";
import { GLOB_IGNORE_PATTERNS } from "./constants.js";
import { FilePatternError } from "./FilePatternError.js";
import { lstatSafe } from "./lstatSafe.js";
import { normalizeToPosix } from "./normalizeToPosix.js";

export async function parseFilePatterns(
    cli: CLI,
    filePatterns: string[],
): Promise<string[]> {
    const seen: Set<string> = new Set();
    const globFileEndingPattern = getGlobFileEndingsPattern(cli.fileEndings);
    const errorMessages: string[] = [];

    const globOptions: Options = {
        dot: true,
        followSymbolicLinks: false,
        ignore: GLOB_IGNORE_PATTERNS,
    };

    for (const pattern of filePatterns) {
        const absolutePath = path.resolve(pattern);
        const stat = await lstatSafe(absolutePath);

        if (stat != null) {
            if (stat.isSymbolicLink()) {
                errorMessages.push(
                    `Specified pattern is a symbolic link: ${pattern}`,
                );
                continue;
            }

            if (stat.isFile()) {
                seen.add(absolutePath);
                continue;
            }

            if (stat.isDirectory()) {
                const files = await fastGlob(`**/*.${globFileEndingPattern}`, {
                    ...globOptions,
                    cwd: absolutePath,
                });
                if (files.length === 0) {
                    errorMessages.push(
                        `No matching files were found in the directory: ${pattern}`,
                    );
                }
                for (const file of files) {
                    seen.add(path.resolve(absolutePath, file));
                }
                continue;
            }
        }

        const glob = normalizeToPosix(pattern);
        const files = await fastGlob(glob, globOptions);
        if (files.length === 0) {
            errorMessages.push(
                `No files matching the pattern were found: ${pattern}`,
            );
        }
        for (const file of files) {
            seen.add(path.resolve(file));
        }
    }

    if (errorMessages.length > 0) {
        throw new FilePatternError(errorMessages);
    }

    return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

function getGlobFileEndingsPattern(fileEndings: readonly string[]): string {
    return fileEndings.length === 1
        ? fileEndings[0]
        : `{${fileEndings.join(",")}}`;
}
