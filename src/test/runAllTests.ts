import fastGlob from "fast-glob";
import Mocha from "mocha";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const mocha = new Mocha({
    ui: "tdd",
    color: true,
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
