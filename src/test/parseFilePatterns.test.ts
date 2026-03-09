import * as assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseFilePatterns } from "../util/parseFilePatterns.js";
import type { CLI } from "../types.js";

suite("parseFilePatterns", () => {
    test("returns explicit files as absolute paths", async () => {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.writeFile(path.join(directory, "one.txt"), "one", "utf8");
            process.chdir(directory);

            const files = await parseFilePatterns(createCLI(), ["one.txt"]);

            assert.deepEqual(files, [path.join(directory, "one.txt")]);
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("expands directories and filters by supported endings", async () => {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.mkdir(path.join(directory, "nested"));
            await fs.writeFile(path.join(directory, "one.txt"), "one", "utf8");
            await fs.writeFile(
                path.join(directory, "nested", "two.txt"),
                "two",
                "utf8",
            );
            await fs.writeFile(path.join(directory, "skip.md"), "skip", "utf8");
            process.chdir(directory);

            const files = await parseFilePatterns(createCLI(), ["."]);

            assert.deepEqual(files, [
                path.join(directory, "nested", "two.txt"),
                path.join(directory, "one.txt"),
            ]);
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("expands glob patterns", async () => {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.mkdir(path.join(directory, "nested"));
            await fs.writeFile(path.join(directory, "one.txt"), "one", "utf8");
            await fs.writeFile(
                path.join(directory, "nested", "two.txt"),
                "two",
                "utf8",
            );
            process.chdir(directory);

            const files = await parseFilePatterns(createCLI(), ["**/*.txt"]);

            assert.deepEqual(files, [
                path.join(directory, "nested", "two.txt"),
                path.join(directory, "one.txt"),
            ]);
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("expands Windows-style glob patterns on Windows", async function () {
        if (path.sep !== "\\") {
            this.skip();
            return;
        }

        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.mkdir(path.join(directory, "nested"));
            await fs.writeFile(path.join(directory, "one.txt"), "one", "utf8");
            await fs.writeFile(
                path.join(directory, "nested", "two.txt"),
                "two",
                "utf8",
            );
            process.chdir(directory);

            const files = await parseFilePatterns(createCLI(), ["**\\*.txt"]);

            assert.deepEqual(files, [
                path.join(directory, "nested", "two.txt"),
                path.join(directory, "one.txt"),
            ]);
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("deduplicates overlapping patterns", async () => {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.writeFile(path.join(directory, "one.txt"), "one", "utf8");
            process.chdir(directory);

            const files = await parseFilePatterns(createCLI(), [
                "one.txt",
                "*.txt",
            ]);

            assert.deepEqual(files, [path.join(directory, "one.txt")]);
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("rejects symbolic links", async function () {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.mkdir(path.join(directory, "target"));

            try {
                await fs.symlink(
                    path.join(directory, "target"),
                    path.join(directory, "linked"),
                    "junction",
                );
            } catch (error) {
                if (
                    error instanceof Error &&
                    "code" in error &&
                    (error.code === "EPERM" || error.code === "EEXIST")
                ) {
                    this.skip();
                    return;
                }

                throw error;
            }

            process.chdir(directory);

            await assert.rejects(
                parseFilePatterns(createCLI(), ["linked"]),
                /Specified pattern "linked" is a symbolic link./,
            );
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });
});

function createCLI(): CLI {
    return {
        binName: "talon-fmt",
        fileEndings: ["txt"],
        getStdinFileEnding: () => "txt",
        format: (text) => Promise.resolve(text),
    };
}

async function createTempDirectory(): Promise<string> {
    return fs.mkdtemp(path.join(os.tmpdir(), "talonfmt-patterns-"));
}

async function cleanupDirectory(directory: string): Promise<void> {
    await fs.rm(directory, { recursive: true, force: true });
}
