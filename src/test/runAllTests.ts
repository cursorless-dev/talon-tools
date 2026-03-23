import fastGlob from "fast-glob";
import Mocha from "mocha";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const cwd = path.dirname(fileURLToPath(import.meta.url));

function getGrep(): string | undefined {
    const args = process.argv.slice(2);
    if (!args.includes("--subset")) {
        return undefined;
    }
    const subsetFile = path.join(cwd, "testSubsetGrep.properties");
    const content = fs.readFileSync(subsetFile, "utf-8");
    const pattern = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("//"))
        .join("|");
    return pattern || undefined;
}

const mocha = new Mocha({
    ui: "tdd",
    color: true,
    grep: getGrep(),
});

const files = fastGlob.sync("**/**.test.ts", { cwd }).sort();

files.forEach((f) => mocha.addFile(path.resolve(cwd, f)));

mocha.run((failures) => {
    if (failures > 0) {
        console.error(`${failures} tests failed.`);
        process.exit(1);
    }
});
