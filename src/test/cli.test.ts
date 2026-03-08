import * as assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { formatFile, formatFiles } from "../cli/cli.js";
import { parseArgs } from "../util/parseArgs.js";

suite("CLI", () => {
    test("formats a file in place", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.txt",
            "content",
        );
        const cli = createCLI((text) => `${text} updated`);

        try {
            const didChange = await formatFile(cli, fileName);
            const actual = await fs.readFile(fileName, "utf8");

            assert.equal(didChange, true);
            assert.equal(actual, "content updated");
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("reports changes without writing in check mode", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.txt",
            "content",
        );
        const cli = createCLI((text) => `${text} updated`);

        try {
            const didChange = await formatFile(cli, fileName, true);
            const actual = await fs.readFile(fileName, "utf8");

            assert.equal(didChange, true);
            assert.equal(actual, "content");
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("counts only changed files", async () => {
        const directory = await fs.mkdtemp(path.join(os.tmpdir(), "talonfmt-"));
        const unchangedFileName = path.join(directory, "unchanged.txt");
        const changedFileName = path.join(directory, "changed.txt");
        const cli = createCLI((text) =>
            text === "changed" ? "changed updated" : text,
        );

        try {
            await fs.writeFile(unchangedFileName, "unchanged", "utf8");
            await fs.writeFile(changedFileName, "changed", "utf8");

            const changedFileCount = await formatFiles(cli, [
                unchangedFileName,
                changedFileName,
            ]);
            const unchangedContent = await fs.readFile(
                unchangedFileName,
                "utf8",
            );
            const changedContent = await fs.readFile(changedFileName, "utf8");

            assert.equal(changedFileCount, 1);
            assert.equal(unchangedContent, "unchanged");
            assert.equal(changedContent, "changed updated");
        } finally {
            await fs.rm(directory, { recursive: true, force: true });
        }
    });

    test("ignores missing files", async () => {
        const fileName = path.join(os.tmpdir(), "talonfmt-missing.txt");
        const cli = createCLI((text) => `${text} updated`);

        const didChange = await formatFile(cli, fileName);

        assert.equal(didChange, false);
    });

    test("wraps formatter errors", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.txt",
            "content",
        );
        const cli = createCLI(() => {
            throw new Error("boom");
        });

        try {
            await assert.rejects(
                formatFile(cli, fileName),
                /Failed to format '.*example\.txt': boom/,
            );
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("parses check mode", () => {
        const actual = parseArgs(["--check", "a.txt", "b.txt"]);

        assert.deepEqual(actual, {
            fileNames: ["a.txt", "b.txt"],
            help: false,
            check: true,
        });
    });

    test("parses check mode and end-of-options marker", () => {
        const actual = parseArgs(["--check", "--", "--check"]);

        assert.deepEqual(actual, {
            fileNames: ["--check"],
            help: false,
            check: true,
        });
    });

    test("rejects conflicting modes", () => {
        assert.throws(
            () => parseArgs(["--check", "--write"]),
            /Unknown argument: --write/,
        );
    });
});

async function createTempFile(
    prefix: string,
    fileName: string,
    content: string,
): Promise<string> {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    const filePath = path.join(directory, fileName);
    await fs.writeFile(filePath, content, "utf8");
    return filePath;
}

async function cleanupTempFile(fileName: string): Promise<void> {
    await fs.rm(path.dirname(fileName), { recursive: true, force: true });
}

function createCLI(format: (text: string) => string | Promise<string>) {
    return {
        binName: "talon-fmt" as const,
        format: (text: string) => Promise.resolve(format(text)),
    };
}
