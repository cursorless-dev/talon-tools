import type { Stats } from "node:fs";
import * as fs from "node:fs/promises";
import { isMissingFileError } from "./isMissingFileError.js";

export async function lstatSafe(filePath: string): Promise<Stats | undefined> {
    try {
        return await fs.lstat(filePath);
    } catch (error) {
        if (isMissingFileError(error)) {
            return undefined;
        }

        throw error;
    }
}
