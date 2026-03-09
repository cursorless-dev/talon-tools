import type { Options } from "fast-glob";
import fastGlob from "fast-glob";
import * as path from "node:path";
import type { CLI } from "../types.js";
import { GLOB_IGNORE_PATTERNS } from "./constants.js";
import { lstatSafe } from "./lstatSafe.js";
import { normalizeToPosix } from "./normalizeToPosix.js";

export async function parseFilePatterns(
    cli: CLI,
    filePatterns: string[],
): Promise<string[]> {
    const seen: Set<string> = new Set();
    const globFileEndingPattern = getGlobFileEndingsPattern(cli.fileEndings);

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
                throw new Error(
                    `Specified pattern "${pattern}" is a symbolic link.`,
                );
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
                for (const file of files) {
                    seen.add(path.resolve(absolutePath, file));
                }
                continue;
            }
        }

        const glob = normalizeToPosix(pattern);
        const files = await fastGlob(glob, globOptions);
        for (const file of files) {
            seen.add(path.resolve(file));
        }
    }

    return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

function getGlobFileEndingsPattern(fileEndings: readonly string[]): string {
    return fileEndings.length === 1
        ? fileEndings[0]
        : `{${fileEndings.join(",")}}`;
}
