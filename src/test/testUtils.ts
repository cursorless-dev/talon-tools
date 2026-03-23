import fastGlob from "fast-glob";
import * as fs from "node:fs";
import * as path from "node:path";
import type { SyntaxNode } from "../types.js";

export function createNode(type: string, text: string): SyntaxNode {
    return {
        id: 1,
        type,
        text,
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: text.length },
        parent: null,
        children: [],
    };
}

export async function captureStreamWrite<T>(
    stream: NodeJS.WriteStream,
    callback: () => Promise<T> | T,
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

export function getFixtures(
    dirName: string,
): { file: string; title: string }[] {
    const fixtures = fastGlob
        .sync(`${dirName}/**`, { cwd: __dirname, absolute: true })
        .sort()
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
        .readFileSync(fixturePath, "utf-8")
        .replaceAll("\r\n", "\n");
    const [input, expected, ...rest] = fixtureContent.split(FIXTURE_DIVIDER);

    if (expected == null || rest.length > 0) {
        throw new Error(`Invalid fixture file '${fixturePath}'`);
    }

    return { input, expected };
}
