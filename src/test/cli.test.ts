import * as assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { formatFile, formatFiles, mainFormatStdin } from "../cli/cli.js";
import type { CLI, Options, ParsedArgs } from "../types.js";
import { EXIT_FAIL, EXIT_OK } from "../util/constants.js";
import { getDefaultArguments } from "../util/getDefaultArguments.js";
import { parseArgs } from "../util/parseArgs.js";
import { printHelp } from "../util/printHelp.js";

suite("CLI", () => {
    test("Formats a file in place", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.txt",
            "content",
        );
        const cli = createCLI((text) => `${text} updated`);

        try {
            const didChange = await formatFile(cli, false, {}, fileName);
            const actual = await fs.readFile(fileName, "utf8");

            assert.equal(didChange, true);
            assert.equal(actual, "content updated");
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Reports changes without writing in check mode", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.txt",
            "content",
        );
        const cli = createCLI((text) => `${text} updated`);

        try {
            const didChange = await formatFile(cli, true, {}, fileName);
            const actual = await fs.readFile(fileName, "utf8");

            assert.equal(didChange, true);
            assert.equal(actual, "content");
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Counts only changed files", async () => {
        const directory = await fs.mkdtemp(path.join(os.tmpdir(), "talonfmt-"));
        const unchangedFileName = path.join(directory, "unchanged.txt");
        const changedFileName = path.join(directory, "changed.txt");
        const cli = createCLI((text) =>
            text === "changed" ? "changed updated" : text,
        );

        try {
            await fs.writeFile(unchangedFileName, "unchanged", "utf8");
            await fs.writeFile(changedFileName, "changed", "utf8");

            const changedFileCount = await formatFiles(cli, false, {}, [
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

    test("Ignores missing files", async () => {
        const fileName = path.join(os.tmpdir(), "talonfmt-missing.txt");
        const cli = createCLI((text) => `${text} updated`);

        const didChange = await formatFile(cli, false, {}, fileName);

        assert.equal(didChange, false);
    });

    test("Wraps formatter errors", async () => {
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
                formatFile(cli, false, {}, fileName),
                /Failed to format '.*example\.txt': boom/,
            );
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Writes formatted stdin to stdout", async () => {
        const cli = createCLI((text) => `${text} updated`);
        const output = await captureStreamWrite(process.stdout, async () =>
            readAndFormatStdin(cli, "content"),
        );

        assert.equal(output.result, EXIT_OK);
        assert.equal(output.text, "content updated");
    });

    test("Reports stdin formatting issues to stderr in check mode", async () => {
        const cli = createCLI((text) => `${text} updated`);
        const output = await captureStreamWrite(process.stderr, async () =>
            readAndFormatStdin(cli, "content", true),
        );

        assert.equal(output.result, EXIT_FAIL);
        assert.equal(output.text, "[warn] Code style issues found in stdin.");
    });

    test("Returns success for unchanged stdin in check mode", async () => {
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

    test("Passes options and file name to file formatter", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.txt",
            "content",
        );
        const options = {
            indentTabs: true,
            indentWidth: 2,
            columnWidth: 24,
        };
        let actualText: string | undefined;
        let actualOptions: Options | undefined;
        let actualFileName: string | undefined;
        const cli: CLI = {
            binName: "talon-fmt",
            fileEndings: ["txt"],
            supportedFlagArgs: ["--indent-tabs"],
            supportedValueArgs: ["--indent-width", "--column-width"],
            format: (text, receivedOptions, receivedFileName) => {
                actualText = text;
                actualOptions = receivedOptions;
                actualFileName = receivedFileName;
                return Promise.resolve(text);
            },
        };

        try {
            await formatFile(cli, false, options, fileName);

            assert.equal(actualText, "content");
            assert.deepEqual(actualOptions, options);
            assert.equal(actualFileName, fileName);
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Passes options and stdin file name to stdin formatter", async () => {
        const options = {
            indentTabs: true,
            indentWidth: 2,
        };
        let actualText: string | undefined;
        let actualOptions: Options | undefined;
        let actualFileName: string | undefined;
        const cli: CLI = {
            binName: "talon-fmt",
            fileEndings: ["txt"],
            supportedFlagArgs: ["--indent-tabs"],
            supportedValueArgs: ["--indent-width", "--column-width"],
            format: (text, receivedOptions, receivedFileName) => {
                actualText = text;
                actualOptions = receivedOptions;
                actualFileName = receivedFileName;
                return Promise.resolve(text);
            },
        };

        const result = await readAndFormatStdin(cli, "content", false, options);

        assert.equal(result, EXIT_OK);
        assert.equal(actualText, "content");
        assert.deepEqual(actualOptions, options);
        assert.equal(actualFileName, "stdin");
    });

    test("Parses check mode", () => {
        const expected = getArguments({
            filePatterns: ["a.txt", "b.txt"],
            check: true,
        });
        const actual = parseArgs(
            createCLI(() => ""),
            ["--check", "a.txt", "b.txt"],
        );

        assert.deepEqual(actual, expected);
    });

    test("Parses check mode and end-of-options marker", () => {
        const expected = getArguments({
            filePatterns: ["--check"],
            check: true,
        });
        const actual = parseArgs(
            createCLI(() => ""),
            ["--check", "--", "--check"],
        );

        assert.deepEqual(actual, expected);
    });

    test("Parses tabs and width arguments", () => {
        const expected = getArguments({
            filePatterns: ["a.txt"],
            help: false,
            version: false,
            check: false,
            indentTabs: true,
            indentWidth: 2,
            lineWidth: 40,
            columnWidth: 24,
        });
        const actual = parseArgs(
            createCLI(() => ""),
            [
                "--indent-tabs",
                "--indent-width",
                "2",
                "--line-width",
                "40",
                "--column-width",
                "24",
                "a.txt",
            ],
        );

        assert.deepEqual(actual, expected);
    });

    test("Rejects unsupported formatter arguments", () => {
        const snippetCli: CLI = {
            ...createCLI(() => ""),
            binName: "snippet-fmt",
            supportedFlagArgs: [],
            supportedValueArgs: [],
        };

        assert.throws(
            () => parseArgs(snippetCli, ["--indent-width", "2"]),
            /Unknown argument: --indent-width/,
        );
    });

    test("Rejects unsupported formatter flags", () => {
        const snippetCli: CLI = {
            ...createCLI(() => ""),
            binName: "snippet-fmt",
            supportedFlagArgs: [],
        };

        assert.throws(
            () => parseArgs(snippetCli, ["--indent-tabs"]),
            /Unknown argument: --indent-tabs/,
        );
    });

    test("Parses only supported arguments for current cli", () => {
        const expected = getArguments({
            filePatterns: ["a.txt"],
            indentTabs: true,
            indentWidth: 2,
            columnWidth: 24,
        });
        const actual = parseArgs(
            createCLI(() => ""),
            [
                "--indent-tabs",
                "--indent-width",
                "2",
                "--column-width",
                "24",
                "a.txt",
            ],
        );

        assert.deepEqual(actual, expected);
    });

    test("Prints help only for supported arguments", async () => {
        const cli: CLI = {
            binName: "tree-sitter-fmt",
            fileEndings: ["scm"],
            supportedFlagArgs: ["--indent-tabs"],
            supportedValueArgs: ["--indent-width"],
            format: (text) => Promise.resolve(text),
        };

        const output = await captureStreamWrite(process.stdout, () => {
            printHelp(cli);
            return Promise.resolve();
        });

        assert.equal(
            output.text,
            [
                "Usage: tree-sitter-fmt [options] [file/dir/glob ...]",
                "",
                "Flags:",
                "  --help",
                "  --version",
                "  --check",
                "  --indent-tabs",
                "",
                "Options:",
                "  --indent-width <n>",
                "",
            ].join("\n"),
        );
    });

    test("Rejects unknown arguments", () => {
        assert.throws(
            () =>
                parseArgs(
                    createCLI(() => ""),
                    ["--check", "--write"],
                ),
            /Unknown argument: --write/,
        );
    });

    test("Rejects missing width values", () => {
        assert.throws(
            () =>
                parseArgs(
                    createCLI(() => ""),
                    ["--indent-width"],
                ),
            /Missing value for argument: --indent-width/,
        );
    });

    test("Rejects invalid width values", () => {
        assert.throws(
            () =>
                parseArgs(
                    createCLI(() => ""),
                    ["--indent-width", "0"],
                ),
            /Invalid value for --indent-width: 0/,
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
        supportedFlagArgs: ["--indent-tabs"],
        supportedValueArgs: [
            "--indent-width",
            "--line-width",
            "--column-width",
        ],
        format: (text: string) => Promise.resolve(format(text)),
    };
}

async function readAndFormatStdin(
    cli: CLI,
    input: string,
    check: boolean = false,
    options: Options = {},
): Promise<number> {
    const stdin = new PassThrough();
    Object.defineProperty(stdin, "isTTY", { value: false });
    const result = mainFormatStdin(cli, stdin, check, options);
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

function getArguments(args: Partial<ParsedArgs>) {
    return {
        ...getDefaultArguments(),
        ...args,
    };
}
