import { exit } from "node:process";
import fastGlob from "fast-glob";
import Mocha from "mocha";
import { getGrep } from "./testUtils.js";

const mocha = new Mocha({
    ui: "tdd",
    color: true,
    grep: getGrep(),
});

const cwd = import.meta.dirname;
const files = fastGlob
    .sync("**/**.test.ts", { cwd, absolute: true })
    .toSorted();

files.forEach((f) => mocha.addFile(f));

mocha.run((failures) => {
    if (failures > 0) {
        console.error(`${failures} tests failed.`);
        exit(1);
    }
});
