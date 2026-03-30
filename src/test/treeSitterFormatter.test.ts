import * as assert from "node:assert";
import {
    treeSitterFormatter as originalTreeSitterFormatter,
    type Options,
} from "../treeSitterFormatter.js";
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
            const actual = await treeSitterFormatter(input, {});
            assert.equal(actual, expected);
        });
    }

    test("endOfLine: CRLF", async () => {
        const actual = await treeSitterFormatter("(aaa (bbb))", {
            endOfLine: "crlf",
        });
        assert.equal(actual, "(aaa\r\n    (bbb)\r\n)\r\n");
    });

    test("indentTabs: true", async () => {
        const actual = await treeSitterFormatter("(aaa (bbb))", {
            indentTabs: true,
        });
        assert.equal(actual, "(aaa\n\t(bbb)\n)\n");
    });

    test("indentSize: 2", async () => {
        const actual = await treeSitterFormatter("(aaa (bbb))", {
            indentSize: 2,
        });
        assert.equal(actual, "(aaa\n  (bbb)\n)\n");
    });

    test("insertFinalNewline: false", async () => {
        const actual = await treeSitterFormatter("(aaa (bbb))", {
            insertFinalNewline: false,
        });
        assert.equal(actual, "(aaa\n    (bbb)\n)");
    });

    test("Syntax tree error", async () => {
        await assert.rejects(
            () => treeSitterFormatter("(aaa!)"),
            (error) => {
                assert.ok(error instanceof Error);
                assert.equal(error.name, "SyntaxTreeError");
                return true;
            },
        );
    });

    test("Debug logs unknown syntax node types", async () => {
        const rootNode = createNode("mystery", "value");
        const output = await captureStreamWrite(process.stderr, () =>
            originalTreeSitterFormatter(rootNode, {}, true),
        );
        assert.equal(output.result, "value\n");
        assert.equal(
            output.text,
            "[debug] Unknown syntax node type 'mystery'\n",
        );
    });
});

async function treeSitterFormatter(
    content: string,
    options: Options = {},
): Promise<string> {
    const node = await parseText(content, "tree-sitter-query");
    return originalTreeSitterFormatter(node, options, true);
}
