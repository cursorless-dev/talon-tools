import type { SyntaxNode } from "../types.js";
export declare function createNode(type: string, text: string): SyntaxNode;
export declare function captureStreamWrite<T>(stream: NodeJS.WriteStream, callback: () => Promise<T> | T): Promise<{
    result: T;
    text: string;
}>;
export declare function getFixtures(dirName: string): {
    file: string;
    title: string;
}[];
export declare function getFixture(fixturePath: string): {
    input: string;
    expected: string;
};
export declare function getGrep(): string | undefined;
