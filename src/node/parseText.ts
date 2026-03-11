import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Node } from "web-tree-sitter";
import { Language, Parser } from "web-tree-sitter";

type ParserName = "tree-sitter-talon" | "tree-sitter-query";

let initPromise: Promise<void> | undefined;
const languageCache = new Map<ParserName, Promise<Language>>();
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function initTreeSitter() {
    initPromise ??= Parser.init();
    return initPromise;
}

function loadLanguage(parserName: ParserName) {
    let promise = languageCache.get(parserName);

    if (promise == null) {
        const wasmFilePath = getWasmFilePath(parserName);
        promise = Language.load(wasmFilePath);
        languageCache.set(parserName, promise);
    }

    return promise;
}

function getWasmFilePath(parserName: ParserName) {
    const fileName = `${parserName}.wasm`;
    const wasmFilePath = [
        path.join(
            moduleDir,
            "../../node_modules/@cursorless/tree-sitter-wasms/out",
            fileName,
        ),
        path.join(
            moduleDir,
            "../node_modules/@cursorless/tree-sitter-wasms/out",
            fileName,
        ),
    ].find((candidate) => fs.existsSync(candidate));

    if (wasmFilePath == null) {
        throw new Error(`Could not find ${fileName}`);
    }

    return wasmFilePath;
}

export async function parseText(
    text: string,
    parserName: ParserName,
): Promise<Node> {
    await initTreeSitter();

    const language = await loadLanguage(parserName);

    const parser = new Parser();
    parser.setLanguage(language);

    const tree = parser.parse(text);

    if (tree == null) {
        throw new Error("Failed to parse text");
    }

    return tree.rootNode;
}
