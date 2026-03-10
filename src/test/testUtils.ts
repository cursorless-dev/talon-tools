import type { SyntaxNode } from "../types.js";

export type Content = string | string[];

export function getContentString(content: Content): string {
    return Array.isArray(content) ? content.join("\n") : content;
}

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
