import * as assert from "node:assert";
import { treeSitterFormatter } from "../treeSitterFormatter.js";
import { parseText } from "../node/parseText.js";
import {
    captureStreamWrite,
    createNode,
    getFixture,
    getFixtures,
} from "./testUtils.js";

suite("Tree-sitter formatter", () => {
    for (const fixture of getFixtures("treeSitterFixtures")) {
        test(fixture.title, async () => {
            const { input, expected } = getFixture(fixture.file);
            const rootNode = await parseText(input, "tree-sitter-query");
            const actual = treeSitterFormatter(rootNode, {});
            assert.equal(actual, expected);
        });
    }

    test("endOfLine: CRLF", async () => {
        const rootNode = await parseText("(aaa (bbb))", "tree-sitter-query");
        const actual = treeSitterFormatter(rootNode, {
            endOfLine: "crlf",
        });
        assert.equal(actual, "(aaa\r\n    (bbb)\r\n)\r\n");
    });

    test("indentTabs: true", async () => {
        const rootNode = await parseText("(aaa (bbb))", "tree-sitter-query");
        const actual = treeSitterFormatter(rootNode, {
            indentTabs: true,
        });
        assert.equal(actual, "(aaa\n\t(bbb)\n)\n");
    });

    test("indentSize: 2", async () => {
        const rootNode = await parseText("(aaa (bbb))", "tree-sitter-query");
        const actual = treeSitterFormatter(rootNode, {
            indentSize: 2,
        });
        assert.equal(actual, "(aaa\n  (bbb)\n)\n");
    });

    test("insertFinalNewline: false", async () => {
        const rootNode = await parseText("(aaa (bbb))", "tree-sitter-query");
        const actual = treeSitterFormatter(rootNode, {
            insertFinalNewline: false,
        });
        assert.equal(actual, "(aaa\n    (bbb)\n)");
    });

    test("Debug logs unknown syntax node types", async () => {
        const rootNode = createNode("mystery", "value");
        const output = await captureStreamWrite(process.stderr, () =>
            treeSitterFormatter(rootNode, {}, true),
        );
        assert.equal(output.result, "value\n");
        assert.equal(
            output.text,
            "[debug] Unknown syntax node type 'mystery'\n",
        );
    });
});
