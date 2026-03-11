import type { SyntaxNode } from "../types.js";
export type Content = string | string[];
export declare function getContentString(content: Content): string;
export declare function createNode(type: string, text: string): SyntaxNode;
export declare function captureStreamWrite<T>(stream: NodeJS.WriteStream, callback: () => Promise<T> | T): Promise<{
    result: T;
    text: string;
}>;
