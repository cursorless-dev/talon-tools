import fastGlob from "fast-glob";
import Mocha from "mocha";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { getGrep } from "./testUtils.js";

const mocha = new Mocha({
    ui: "tdd",
    color: true,
    grep: getGrep(),
});

const cwd = path.dirname(fileURLToPath(import.meta.url));
const files = fastGlob.sync("**/**.test.ts", { cwd, absolute: true }).sort();

files.forEach((f) => mocha.addFile(f));

mocha.run((failures) => {
    if (failures > 0) {
        console.error(`${failures} tests failed.`);
        process.exit(1);
    }
});
