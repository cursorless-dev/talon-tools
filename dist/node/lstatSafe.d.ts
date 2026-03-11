import type { Stats } from "node:fs";
export declare function lstatSafe(filePath: string): Promise<Stats | undefined>;
