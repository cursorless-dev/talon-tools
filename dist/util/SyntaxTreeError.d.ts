import type { SyntaxNode } from "../types.js";
import { SyntaxError } from "./SyntaxError.js";
export declare class SyntaxTreeError extends SyntaxError {
    constructor(rootNode: SyntaxNode);
}
