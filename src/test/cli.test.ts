/* eslint-disable @typescript-eslint/naming-convention */

import * as assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { formatFile, formatFiles, main, mainFormatStdin } from "../cli/cli.js";
import type {
    CLI,
    EditorConfigOptions,
    Logger,
    Options,
    ParsedArgs,
} from "../types.js";
import { EXIT_FAIL, EXIT_OK } from "../util/constants.js";
import { createLogger } from "../util/createLogger.js";
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
        const logger = createLogger(true);

        try {
            const didChange = await formatFile({
                cli,
                logger,
                check: false,
                debug: false,
                filePath: fileName,
            });
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
        const logger = createLogger(true);

        try {
            const didChange = await formatFile({
                cli,
                logger,
                check: true,
                debug: false,
                filePath: fileName,
            });
            const actual = await fs.readFile(fileName, "utf8");

            assert.equal(didChange, true);
            assert.equal(actual, "content");
            assert.deepEqual(logger.getEntries(), [
                { level: "log", message: fileName },
            ]);
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
        const logger = createLogger(true);

        try {
            await fs.writeFile(unchangedFileName, "unchanged", "utf8");
            await fs.writeFile(changedFileName, "changed", "utf8");

            const changedFileCount = await formatFiles({
                cli,
                logger,
                check: false,
                debug: false,
                filePaths: [unchangedFileName, changedFileName],
            });
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
        const logger = createLogger(true);

        const didChange = await formatFile({
            cli,
            logger,
            check: false,
            debug: false,
            filePath: fileName,
        });

        assert.equal(didChange, false);
    });

    test("Formats a file using settings from .editorconfig", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.talon",
            "content",
        );
        const cli = createCLI(
            (_text, options) => `indentSize=${options.indentSize ?? "unset"}`,
        );
        const logger = createLogger(true);

        try {
            await writeEditorConfig(fileName, {
                indent_size: 2,
            });

            const didChange = await formatFile({
                cli,
                logger,
                check: false,
                debug: false,
                filePath: fileName,
            });
            const actual = await fs.readFile(fileName, "utf8");

            assert.equal(didChange, true);
            assert.equal(actual, "indentSize=2");
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Uses tab_width when indent_size is tab", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.talon",
            "content",
        );
        const cli = createCLI(
            (_text, options) => `indentSize=${options.indentSize ?? "unset"}`,
        );
        const logger = createLogger(true);

        try {
            await writeEditorConfig(fileName, {
                indent_size: "tab",
                tab_width: 3,
            });

            const didChange = await formatFile({
                cli,
                logger,
                check: false,
                debug: false,
                filePath: fileName,
            });
            const actual = await fs.readFile(fileName, "utf8");

            assert.equal(didChange, true);
            assert.equal(actual, "indentSize=3");
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Passes max line length from .editorconfig", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.talon",
            "content",
        );
        const cli = createCLI(
            (_text, options) =>
                `maxLineLength=${options.maxLineLength ?? "unset"}`,
        );
        const logger = createLogger(true);

        try {
            await writeEditorConfig(fileName, {
                max_line_length: 80,
            });

            const didChange = await formatFile({
                cli,
                logger,
                check: false,
                debug: false,
                filePath: fileName,
            });
            const actual = await fs.readFile(fileName, "utf8");

            assert.equal(didChange, true);
            assert.equal(actual, "maxLineLength=80");
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Passes end of line from .editorconfig", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.talon",
            "content",
        );
        const cli = createCLI(
            (_text, options) => `endOfLine=${options.endOfLine ?? "unset"}`,
        );
        const logger = createLogger(true);

        try {
            await writeEditorConfig(fileName, {
                end_of_line: "crlf",
            });

            const didChange = await formatFile({
                cli,
                logger,
                check: false,
                debug: false,
                filePath: fileName,
            });
            const actual = await fs.readFile(fileName, "utf8");

            assert.equal(didChange, true);
            assert.equal(actual, "endOfLine=crlf");
        } finally {
            await cleanupTempFile(fileName);
        }
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
        const logger = createLogger(true);

        try {
            await assert.rejects(
                formatFile({
                    cli,
                    logger,
                    check: false,
                    debug: false,
                    filePath: fileName,
                }),
                /Failed to format '.*example\.txt': boom/,
            );
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Writes formatted stdin to stdout", async () => {
        const cli = createCLI((text) => `${text} updated`);
        const logger = createLogger();
        const output = await captureStreamWrite(process.stdout, async () =>
            readAndFormatStdin(cli, logger, "content"),
        );

        assert.equal(output.result, EXIT_OK);
        assert.equal(output.text, "content updated");
    });

    test("Reports stdin formatting issues to stderr in check mode", async () => {
        const cli = createCLI((text) => `${text} updated`);
        const logger = createLogger();
        const output = await captureStreamWrite(process.stderr, async () =>
            readAndFormatStdin(cli, logger, "content", true),
        );

        assert.equal(output.result, EXIT_FAIL);
        assert.equal(output.text, "[warn] Code style issues found in stdin.\n");
    });

    test("Captures check-mode file entries without writing when quiet", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.txt",
            "content",
        );
        const cli = createCLI((text) => `${text} updated`);
        const logger = createLogger(true);

        try {
            const stdout = await captureStreamWrite(process.stdout, async () =>
                formatFile({
                    cli,
                    logger,
                    check: true,
                    debug: false,
                    filePath: fileName,
                }),
            );
            const stderr = await captureStreamWrite(process.stderr, async () =>
                Promise.resolve(),
            );

            assert.equal(stdout.result, true);
            assert.equal(stdout.text, "");
            assert.equal(stderr.text, "");
            assert.deepEqual(logger.getEntries(), [
                { level: "log", message: fileName },
            ]);
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Check mode reports summary and changed file paths", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.txt",
            "content",
        );
        const cli = createCLI((text) => `${text} updated`);
        const originalArgv = process.argv;
        const originalExitCode = process.exitCode;

        try {
            process.argv = ["node", "talon-fmt", "--check", fileName];

            const output = await captureStdoutAndStderr(async () => {
                await main(cli);
                return process.exitCode;
            });

            assert.equal(output.result, EXIT_FAIL);
            assert.equal(
                output.stdoutText,
                ["Checking formatting...", `${fileName}`, ""].join("\n"),
            );
            assert.equal(
                output.stderrText,
                "[warn] Code style issues found in 1 file(s).\n",
            );
        } finally {
            process.argv = originalArgv;
            process.exitCode = originalExitCode;
            await cleanupTempFile(fileName);
        }
    });

    test("Returns success for unchanged stdin in check mode", async () => {
        const cli = createCLI((text) => text);
        const logger = createLogger();
        const stderr = await captureStreamWrite(process.stderr, async () =>
            readAndFormatStdin(cli, logger, "content", true),
        );
        const stdout = await captureStreamWrite(process.stdout, async () =>
            readAndFormatStdin(cli, logger, "content", true),
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
        const expectedOptions = {
            indentTabs: true,
            indentSize: 2,
            columnWidth: 24,
        };
        let actualText: string | undefined;
        let actualOptions: Options | undefined;
        let actualFileName: string | undefined;
        const cli: CLI = {
            binName: "talon-fmt",
            fileEndings: ["txt"],
            getStdinFileEnding: () => "txt",
            format: (text, receivedOptions, receivedFileName) => {
                actualText = text;
                actualOptions = receivedOptions;
                actualFileName = receivedFileName;
                return Promise.resolve(text);
            },
        };
        const logger = createLogger(true);

        try {
            await writeEditorConfig(fileName, {
                indent_style: "tab",
                indent_size: 2,
                column_width: 24,
            });
            await formatFile({
                cli,
                logger,
                check: false,
                debug: false,
                filePath: fileName,
            });

            assert.equal(actualText, "content");
            assert.deepEqual(actualOptions, expectedOptions);
            assert.equal(actualFileName, fileName);
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Passes options and stdin file name to stdin formatter", async () => {
        const options = {
            indentTabs: true,
            indentSize: 2,
        };
        let actualText: string | undefined;
        let actualOptions: Options | undefined;
        let actualFileName: string | undefined;
        const directory = await fs.mkdtemp(path.join(os.tmpdir(), "talonfmt-"));
        const cwd = process.cwd();
        const cli: CLI = {
            binName: "talon-fmt",
            fileEndings: ["txt"],
            getStdinFileEnding: () => "txt",
            format: (text, receivedOptions, receivedFileName) => {
                actualText = text;
                actualOptions = receivedOptions;
                actualFileName = receivedFileName;
                return Promise.resolve(text);
            },
        };
        const logger = createLogger(true);

        try {
            process.chdir(directory);
            await writeEditorConfig(path.join(directory, "stdin.txt"), {
                indent_style: "tab",
                indent_size: 2,
            });

            const result = await readAndFormatStdin(
                cli,
                logger,
                "content",
                false,
            );

            assert.equal(result, EXIT_OK);
            assert.equal(actualText, "content");
            assert.deepEqual(actualOptions, options);
            assert.equal(actualFileName, path.join(directory, "stdin.txt"));
        } finally {
            process.chdir(cwd);
            await fs.rm(directory, { recursive: true, force: true });
        }
    });

    test("Parses check mode", () => {
        const expected = getArguments({
            filePatterns: ["a.txt", "b.txt"],
            check: true,
        });
        const actual = parseArgs(["--check", "a.txt", "b.txt"]);

        assert.deepEqual(actual, expected);
    });

    test("Parses quiet mode", () => {
        const expected = getArguments({
            filePatterns: ["a.txt"],
            quiet: true,
        });
        const actual = parseArgs(["--quiet", "a.txt"]);

        assert.deepEqual(actual, expected);
    });

    test("Parses debug mode", () => {
        const expected = getArguments({
            filePatterns: ["a.txt"],
            debug: true,
        });
        const actual = parseArgs(["--debug", "a.txt"]);

        assert.deepEqual(actual, expected);
    });

    test("Parses check mode and end-of-options marker", () => {
        const expected = getArguments({
            filePatterns: ["--check"],
            check: true,
        });
        const actual = parseArgs(["--check", "--", "--check"]);

        assert.deepEqual(actual, expected);
    });

    test("Prints help only for supported arguments", async () => {
        const cli: CLI = {
            binName: "tree-sitter-fmt",
            fileEndings: ["scm"],
            getStdinFileEnding: () => "scm",
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
                "Options:",
                "  --help",
                "  --version",
                "  --quiet",
                "  --check",
                "  --debug",
                "",
            ].join("\n"),
        );
    });

    test("Captures log entries without writing when quiet", async () => {
        const fileName = await createTempFile(
            "talonfmt-",
            "example.txt",
            "content",
        );
        const cli = createCLI((text) => `${text} updated`);
        const logger = createLogger(true);

        try {
            const output = await captureStreamWrite(process.stdout, async () =>
                formatFile({
                    cli,
                    logger,
                    check: false,
                    debug: false,
                    filePath: fileName,
                }),
            );

            assert.equal(output.result, true);
            assert.equal(output.text, "");
            assert.deepEqual(logger.getEntries(), [
                { level: "log", message: fileName },
            ]);
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("Rejects unknown arguments", () => {
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

async function writeEditorConfig(
    fileName: string,
    config: EditorConfigOptions,
): Promise<void> {
    const extension = path.extname(fileName).slice(1);
    const editorConfigPath = path.join(path.dirname(fileName), ".editorconfig");
    const lines = [
        `[*.${extension}]`,
        ...Object.entries(config).map(([key, value]) => `${key} = ${value}`),
        "",
    ];
    await fs.writeFile(editorConfigPath, lines.join("\n"), "utf8");
}

function createCLI(
    format: (text: string, options: Options) => string | Promise<string>,
): CLI {
    return {
        binName: "talon-fmt" as const,
        fileEndings: ["txt"],
        getStdinFileEnding: () => "txt",
        format: (
            text: string,
            options: Options,
            _filePath: string,
            _debug: boolean,
        ) => Promise.resolve(format(text, options)),
    };
}

async function readAndFormatStdin(
    cli: CLI,
    logger: Logger,
    input: string,
    check: boolean = false,
): Promise<number> {
    const stdin = new PassThrough();
    Object.defineProperty(stdin, "isTTY", { value: false });
    const result = mainFormatStdin({
        cli,
        logger,
        stdin,
        check,
        debug: false,
    });
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

async function captureStdoutAndStderr<T>(
    callback: () => Promise<T>,
): Promise<{ result: T; stdoutText: string; stderrText: string }> {
    let stdoutText = "";
    let stderrText = "";
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);

    (process.stdout.write as unknown as (chunk: string) => boolean) = (
        chunk: string | Uint8Array,
    ) => {
        stdoutText += chunk.toString();
        return true;
    };

    (process.stderr.write as unknown as (chunk: string) => boolean) = (
        chunk: string | Uint8Array,
    ) => {
        stderrText += chunk.toString();
        return true;
    };

    try {
        const result = await callback();
        return { result, stdoutText, stderrText };
    } finally {
        process.stdout.write = originalStdoutWrite;
        process.stderr.write = originalStderrWrite;
    }
}

function getArguments(args: Partial<ParsedArgs>) {
    return {
        ...getDefaultArguments(),
        ...args,
    };
}
