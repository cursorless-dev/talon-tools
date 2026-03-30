import fastGlob from "fast-glob";
import * as fs from "node:fs";
import * as path from "node:path";
import type { SyntaxNode } from "../types.js";
import { fileURLToPath } from "node:url";

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export function getGrep(): string | undefined {
    const args = process.argv.slice(2);
    if (!args.includes("--subset")) {
        return undefined;
    }
    const subsetFile = path.join(__dirname, "testSubsetGrep.properties");
    const content = fs.readFileSync(subsetFile, "utf-8");
    const pattern = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("//"))
        .join("|");
    return pattern || undefined;
}
