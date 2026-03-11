import * as assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseFilePatterns } from "../node/parseFilePatterns.js";
import type { CLI } from "../types.js";
import { FilePatternError } from "../node/FilePatternError.js";

suite("Parse file patterns", () => {
    test("Returns explicit files as absolute paths", async () => {
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

    test("Expands directories and filters by supported endings", async () => {
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

    test("Expands directories with multiple supported endings", async () => {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.writeFile(path.join(directory, "one.txt"), "one", "utf8");
            await fs.writeFile(
                path.join(directory, "two.talon"),
                "two",
                "utf8",
            );
            await fs.writeFile(path.join(directory, "skip.md"), "skip", "utf8");
            process.chdir(directory);

            const files = await parseFilePatterns(createCLI(["txt", "talon"]), [
                ".",
            ]);

            assert.deepEqual(files, [
                path.join(directory, "one.txt"),
                path.join(directory, "two.talon"),
            ]);
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("Ignores hardcoded directories during directory expansion", async () => {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.mkdir(path.join(directory, "nested"));
            await fs.mkdir(path.join(directory, "node_modules"));
            await fs.writeFile(
                path.join(directory, "nested", "one.txt"),
                "one",
            );
            await fs.writeFile(
                path.join(directory, "node_modules", "ignored.txt"),
                "ignored",
            );
            process.chdir(directory);

            const files = await parseFilePatterns(createCLI(), ["."]);

            assert.deepEqual(files, [
                path.join(directory, "nested", "one.txt"),
            ]);
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("Expands glob patterns", async () => {
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

    test("Glob patterns filter by supported endings", async () => {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.writeFile(path.join(directory, "one.txt"), "one", "utf8");
            await fs.writeFile(path.join(directory, "two.md"), "two", "utf8");
            process.chdir(directory);

            const files = await parseFilePatterns(createCLI(), ["**/*.*"]);

            assert.deepEqual(files, [path.join(directory, "one.txt")]);
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("Expands Windows-style glob patterns on Windows", async function () {
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

    test("Deduplicates overlapping patterns", async () => {
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

    test("Rejects symbolic links", async function () {
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
                (error: unknown) =>
                    error instanceof FilePatternError &&
                    error.messages.length === 1 &&
                    error.messages[0] ===
                        "Specified pattern is a symbolic link: linked",
            );
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("Rejects directories with no matching files", async () => {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.writeFile(path.join(directory, "skip.md"), "skip", "utf8");
            process.chdir(directory);

            await assert.rejects(
                parseFilePatterns(createCLI(), ["."]),
                (error: unknown) =>
                    error instanceof FilePatternError &&
                    error.messages.length === 1 &&
                    error.messages[0] ===
                        "No matching files were found in the directory: .",
            );
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("Rejects unmatched glob patterns", async () => {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            await fs.writeFile(path.join(directory, "one.txt"), "one", "utf8");
            process.chdir(directory);

            await assert.rejects(
                parseFilePatterns(createCLI(), ["**/*.md"]),
                (error: unknown) =>
                    error instanceof FilePatternError &&
                    error.messages.length === 1 &&
                    error.messages[0] ===
                        "No files matching the pattern were found: **/*.md",
            );
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });

    test("Aggregates multiple pattern errors", async () => {
        const directory = await createTempDirectory();
        const cwd = process.cwd();

        try {
            process.chdir(directory);

            await assert.rejects(
                parseFilePatterns(createCLI(), [".", "**/*.txt"]),
                (error: unknown) =>
                    error instanceof FilePatternError &&
                    error.messages.length === 2 &&
                    error.messages[0] ===
                        "No matching files were found in the directory: ." &&
                    error.messages[1] ===
                        "No files matching the pattern were found: **/*.txt",
            );
        } finally {
            process.chdir(cwd);
            await cleanupDirectory(directory);
        }
    });
});

function createCLI(fileEndings: readonly string[] = ["txt"]): CLI {
    return {
        binName: "talon-fmt",
        fileEndings,
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
