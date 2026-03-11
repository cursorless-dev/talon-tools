/* eslint-disable @typescript-eslint/naming-convention */

import * as assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getOptionsFromConfig } from "../node/getOptionsFromConfig.js";
import type { EditorConfigOptions } from "../types.js";

suite("getOptionsFromConfig", () => {
    test("indent_style: space sets indentTabs: false", async () => {
        const fileName = await createTempFile("talonfmt-", "example.talon");

        try {
            await writeEditorConfig(fileName, {
                indent_style: "space",
            });

            const actual = await getOptionsFromConfig(fileName);

            assert.deepEqual(actual, {
                indentTabs: false,
            });
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("indent_style: tab sets indentTabs: true", async () => {
        const fileName = await createTempFile("talonfmt-", "example.talon");

        try {
            await writeEditorConfig(fileName, {
                indent_style: "tab",
            });

            const actual = await getOptionsFromConfig(fileName);

            assert.deepEqual(actual, {
                indentTabs: true,
            });
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("indent_style: tab with tab_width sets indentTabs and indentSize", async () => {
        const fileName = await createTempFile("talonfmt-", "example.talon");

        try {
            await writeEditorConfig(fileName, {
                indent_style: "tab",
                indent_size: "tab",
                tab_width: 3,
            });

            const actual = await getOptionsFromConfig(fileName);

            assert.deepEqual(actual, {
                indentTabs: true,
                indentSize: 3,
            });
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("indent_size: 2 sets indentSize: 2", async () => {
        const fileName = await createTempFile("talonfmt-", "example.talon");

        try {
            await writeEditorConfig(fileName, {
                indent_size: 2,
            });

            const actual = await getOptionsFromConfig(fileName);

            assert.deepEqual(actual, {
                indentSize: 2,
            });
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("insert_final_newline: false sets insertFinalNewline: false", async () => {
        const fileName = await createTempFile("talonfmt-", "example.talon");

        try {
            await writeEditorConfig(fileName, {
                insert_final_newline: false,
            });

            const actual = await getOptionsFromConfig(fileName);

            assert.deepEqual(actual, {
                insertFinalNewline: false,
            });
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("preserve_multiline: true sets preserveMultiline: true", async () => {
        const fileName = await createTempFile("talonfmt-", "example.talon");

        try {
            await writeEditorConfig(fileName, {
                preserve_multiline: true,
            });

            const actual = await getOptionsFromConfig(fileName);

            assert.deepEqual(actual, {
                preserveMultiline: true,
            });
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("max_line_length: 80 sets maxLineLength: 80", async () => {
        const fileName = await createTempFile("talonfmt-", "example.talon");

        try {
            await writeEditorConfig(fileName, {
                max_line_length: 80,
            });

            const actual = await getOptionsFromConfig(fileName);

            assert.deepEqual(actual, {
                maxLineLength: 80,
            });
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("column_width: 24 sets columnWidth: 24", async () => {
        const fileName = await createTempFile("talonfmt-", "example.talon");

        try {
            await writeEditorConfig(fileName, {
                column_width: 24,
            });

            const actual = await getOptionsFromConfig(fileName);

            assert.deepEqual(actual, {
                columnWidth: 24,
            });
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("end_of_line: crlf sets endOfLine: crlf", async () => {
        const fileName = await createTempFile("talonfmt-", "example.talon");

        try {
            await writeEditorConfig(fileName, {
                end_of_line: "crlf",
            });

            const actual = await getOptionsFromConfig(fileName);

            assert.deepEqual(actual, {
                endOfLine: "crlf",
            });
        } finally {
            await cleanupTempFile(fileName);
        }
    });

    test("end_of_line: unset is ignored", async () => {
        const fileName = await createTempFile("talonfmt-", "example.talon");

        try {
            await writeEditorConfig(fileName, {
                end_of_line: "unset",
            });

            const actual = await getOptionsFromConfig(fileName);

            assert.deepEqual(actual, {});
        } finally {
            await cleanupTempFile(fileName);
        }
    });
});

async function createTempFile(
    prefix: string,
    fileName: string,
): Promise<string> {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    const filePath = path.join(directory, fileName);
    await fs.writeFile(filePath, "", "utf8");
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
