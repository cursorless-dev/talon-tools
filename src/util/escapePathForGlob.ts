import fastGlob from "fast-glob";

/**
 * This function should be replaced with `fastGlob.escapePath` when these issues are fixed:
 * - https://github.com/mrmlnc/fast-glob/issues/261
 * - https://github.com/mrmlnc/fast-glob/issues/262
 * @param {string} path
 */
export function escapePathForGlob(path: string): string {
    return fastGlob
        .escapePath(
            path.replaceAll("\\", "\0"), // Workaround for fast-glob#262 (part 1)
        )
        .replaceAll(String.raw`\!`, "@(!)") // Workaround for fast-glob#261
        .replaceAll("\0", String.raw`@(\\)`); // Workaround for fast-glob#262 (part 2)
}
