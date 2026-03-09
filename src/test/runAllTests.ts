import fastGlob from "fast-glob";
import Mocha from "mocha";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const grep = `
// Formats a file in place
`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("//"))
    .join("|");

const mocha = new Mocha({
    ui: "tdd",
    color: true,
    grep: grep || undefined,
});

const cwd = path.dirname(fileURLToPath(import.meta.url));

const files = fastGlob.sync("**/**.test.ts", { cwd }).sort();

files.forEach((f) => mocha.addFile(path.resolve(cwd, f)));

mocha.run((failures) => {
    if (failures > 0) {
        console.error(`${failures} tests failed.`);
        process.exit(1);
    }
});
