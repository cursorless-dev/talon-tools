import path from "node:path";
import { Parser, Language, type Node } from "web-tree-sitter";

type LanguageName = "tree-sitter-talon" | "tree-sitter-query";

let initPromise: Promise<void> | undefined;
const languageCache = new Map<LanguageName, Promise<Language>>();

function initTreeSitter() {
    initPromise ??= Parser.init();
    return initPromise;
}

function loadLanguage(lang: LanguageName) {
    let promise = languageCache.get(lang);

    if (promise == null) {
        const wasmFilePath = path.join(
            __dirname,
            "../../node_modules/@cursorless/tree-sitter-wasms/out",
            `${lang}.wasm`,
        );
        promise = Language.load(wasmFilePath);
        languageCache.set(lang, promise);
    }

    return promise;
}

export async function parseText(
    text: string,
    lang: LanguageName,
): Promise<Node> {
    await initTreeSitter();

    const language = await loadLanguage(lang);

    const parser = new Parser();
    parser.setLanguage(language);

    const tree = parser.parse(text);

    if (tree == null) {
        throw new Error("Failed to parse text");
    }

    return tree.rootNode;
}
