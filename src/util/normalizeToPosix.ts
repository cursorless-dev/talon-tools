import * as path from "node:path";

/**
 * Replace `\` with `/` on Windows
 * @param {string} filepath
 * @returns {string}
 */
export const normalizeToPosix =
    path.sep === "\\"
        ? (filepath: string) => filepath.replaceAll("\\", "/")
        : (filepath: string) => filepath;
