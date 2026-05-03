import type { SyntaxNode } from "../types.js";
import { SyntaxError } from "./SyntaxError.js";

export class SyntaxTreeError extends SyntaxError {
    public constructor(rootNode: SyntaxNode) {
        super(findFirstProblemNode(rootNode)?.startPosition);
        this.name = "SyntaxTreeError";
    }
}

function findFirstProblemNode(node: SyntaxNode): SyntaxNode | null {
    if (node.isError || node.isMissing) {
        return node;
    }
    for (const child of node.children) {
        if (!child.hasError) {
            continue;
        }
        const errorNode = findFirstProblemNode(child);
        if (errorNode != null) {
            return errorNode;
        }
    }
    return null;
}
