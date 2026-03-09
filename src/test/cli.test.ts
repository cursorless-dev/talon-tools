import * as assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { formatFile, formatFiles, mainFormatStdin } from "../cli/cli.js";
import type { CLI, ParsedArgs } from "../types.js";
import { EXIT_FAIL, EXIT_OK } from "../util/constants.js";
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
            const didChange = await formatFile(cli, fileName, false);
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

            const changedFileCount = await formatFiles(
                cli,
                [unchangedFileName, changedFileName],
                false,
            );
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

        const didChange = await formatFile(cli, fileName, false);

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
                formatFile(cli, fileName, false),
                /Failed to format '.*example\.txt': boom/,
            );
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("writes formatted stdin to stdout", async () => {
        const cli = createCLI((text) => `${text} updated`);
        const output = await captureStreamWrite(process.stdout, async () =>
            readAndFormatStdin(cli, "content"),
        );

        assert.equal(output.result, EXIT_OK);
        assert.equal(output.text, "content updated");
    });

    test("reports stdin formatting issues to stderr in check mode", async () => {
        const cli = createCLI((text) => `${text} updated`);
        const output = await captureStreamWrite(process.stderr, async () =>
            readAndFormatStdin(cli, "content", true),
        );

        assert.equal(output.result, EXIT_FAIL);
        assert.equal(output.text, "[warn] Code style issues found in stdin.");
    });

    test("returns success for unchanged stdin in check mode", async () => {
        const cli = createCLI((text) => text);
        const stderr = await captureStreamWrite(process.stderr, async () =>
            readAndFormatStdin(cli, "content", true),
        );
        const stdout = await captureStreamWrite(process.stdout, async () =>
            readAndFormatStdin(cli, "content", true),
        );

        assert.equal(stderr.result, EXIT_OK);
        assert.equal(stderr.text, "");
        assert.equal(stdout.result, EXIT_OK);
        assert.equal(stdout.text, "");
    });

    test("parses check mode", () => {
        const expected: ParsedArgs = {
            filePatterns: ["a.txt", "b.txt"],
            help: false,
            version: false,
            check: true,
        };
        const actual = parseArgs(["--check", "a.txt", "b.txt"]);

        assert.deepEqual(actual, expected);
    });

    test("parses check mode and end-of-options marker", () => {
        const expected: ParsedArgs = {
            filePatterns: ["--check"],
            help: false,
            version: false,
            check: true,
        };
        const actual = parseArgs(["--check", "--", "--check"]);

        assert.deepEqual(actual, expected);
    });

    test("rejects unknown arguments", () => {
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

function createCLI(format: (text: string) => string | Promise<string>): CLI {
    return {
        binName: "talon-fmt" as const,
        fileEndings: ["txt"],
        format: (text: string) => Promise.resolve(format(text)),
    };
}

async function readAndFormatStdin(
    cli: CLI,
    input: string,
    check: boolean = false,
): Promise<number> {
    const stdin = new PassThrough();
    Object.defineProperty(stdin, "isTTY", { value: false });
    const result = mainFormatStdin(cli, stdin, check);
    stdin.end(input);
    return result;
}

async function captureStreamWrite<T>(
    stream: NodeJS.WriteStream,
    callback: () => Promise<T>,
): Promise<{ result: T; text: string }> {
    let text = "";
    const originalWrite = stream.write.bind(stream);

    (stream.write as unknown as (chunk: string) => boolean) = (
        chunk: string | Uint8Array,
    ) => {
        text += chunk.toString();
        return true;
    };

    try {
        const result = await callback();
        return { result, text };
    } finally {
        stream.write = originalWrite;
    }
}
