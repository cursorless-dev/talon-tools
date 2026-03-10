/* eslint-disable @typescript-eslint/naming-convention */

import * as assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { EditorConfigOptions } from "../types.js";
import { getOptionsFromConfig } from "../util/getOptionsFromConfig.js";

suite("getOptionsFromConfig", () => {
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
