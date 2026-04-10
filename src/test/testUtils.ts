import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import fastGlob from "fast-glob";
import type { SyntaxNode } from "../types.js";

export function createNode(type: string, text: string): SyntaxNode {
    return {
        id: 1,
        type,
        text,
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: text.length },
        parent: null,
        hasError: false,
        isError: false,
        isMissing: false,
        children: [],
    };
}

export async function captureStreamWrite<T>(
    stream: NodeJS.WriteStream,
    callback: () => Promise<T> | T,
): Promise<{ result: T; text: string }> {
    let text = "";
    const originalWrite = stream.write.bind(stream);

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
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

export function getFixtures(
    dirName: string,
): { file: string; title: string }[] {
    // oxlint-disable-next-line unicorn/prefer-import-meta-properties
    const cwd = path.dirname(fileURLToPath(import.meta.url));
    const fixtures = fastGlob
        .sync(`${dirName}/**`, { cwd, absolute: true })
        .toSorted()
        .map((file) => ({ file, title: path.basename(file, ".txt") }));

    if (fixtures.length === 0) {
        throw new Error(`No fixtures found in directory '${dirName}'`);
    }

    return fixtures;
}

const FIXTURE_DIVIDER = "\n================ EXPECTED ================\n";

export function getFixture(fixturePath: string): {
    input: string;
    expected: string;
} {
    const fixtureContent = fs
        .readFileSync(fixturePath, "utf8")
        .replaceAll("\r\n", "\n");
    const parts = fixtureContent.split(FIXTURE_DIVIDER);

    if (parts.length !== 2) {
        throw new Error(`Invalid fixture file '${fixturePath}'`);
    }

    const [input, expected] = parts;
    return { input, expected };
}

export function getGrep(): string | undefined {
    const args = process.argv.slice(2);
    if (!args.includes("--subset")) {
        return undefined;
    }
    const subsetFile = path.join(
        import.meta.dirname,
        "testSubsetGrep.properties",
    );
    const content = fs.readFileSync(subsetFile, "utf8");
    const pattern = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("//"))
        .join("|");
    return pattern || undefined;
}
