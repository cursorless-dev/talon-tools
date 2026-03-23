import * as assert from "node:assert";
import { parseText } from "../node/parseText.js";
import type { Options } from "../talon/talonFormatter.js";
import { talonFormatter as originalTalonFormatter } from "../talon/talonFormatter.js";
import {
    captureStreamWrite,
    createNode,
    getFixture,
    getFixtures,
} from "./testUtils.js";

suite("Talon formatter", () => {
    for (const fixture of getFixtures("talonFixtures")) {
        test(fixture.title, async () => {
            const { input, expected } = getFixture(fixture.file);
            const actual = await talonFormatter(input);
            assert.equal(actual, expected);
        });
    }

    test("CRLF comment", async () => {
        const actual = await talonFormatter("# Hello\r\nfoo: 'bar'");
        assert.equal(actual, "# Hello\nfoo: 'bar'\n");
    });

    test("endOfLine: CRLF", async () => {
        const actual = await talonFormatter("foo:\n  edit.left()", {
            endOfLine: "crlf",
            preserveMultiline: true,
        });
        assert.equal(actual, "foo:\r\n    edit.left()\r\n");
    });

    test("indentTabs: true", async () => {
        const actual = await talonFormatter("foo:\n  edit.left()", {
            indentTabs: true,
            preserveMultiline: true,
        });
        assert.equal(actual, "foo:\n\tedit.left()\n");
    });

    test("indentSize: 2", async () => {
        const actual = await talonFormatter("foo:\n  edit.left()", {
            indentSize: 2,
            preserveMultiline: true,
        });
        assert.equal(actual, "foo:\n  edit.left()\n");
    });

    test("insertFinalNewline: false", async () => {
        const actual = await talonFormatter("foo:\n  edit.left()", {
            insertFinalNewline: false,
        });
        assert.equal(actual, "foo: edit.left()");
    });

    test("maxLineLength: 7", async () => {
        const actual = await talonFormatter("aaa: bbb", {
            maxLineLength: 7,
        });
        assert.equal(actual, "aaa:\n    bbb\n");
    });

    test("maxLineLength: default", async () => {
        const right = `"${"a".repeat(76)}"`;
        const actual = await talonFormatter(`foo: ${right}`);
        assert.equal(actual, `foo:\n    ${right}\n`);
    });

    test("preserveMultiline: true", async () => {
        const actual = await talonFormatter("aaa:\n    bbb", {
            preserveMultiline: true,
        });
        assert.equal(actual, "aaa:\n    bbb\n");
    });

    test("columnWidth: 10", async () => {
        const actual = await talonFormatter("aaa:\n    bbb", {
            columnWidth: 10,
        });
        assert.equal(actual, "aaa:      bbb\n");
    });

    test("Debug logs unknown syntax node types", async () => {
        const rootNode = createNode("mystery", "value");
        const output = await captureStreamWrite(process.stderr, () =>
            originalTalonFormatter(rootNode, {}, true),
        );
        assert.equal(output.result, "value\n");
        assert.equal(
            output.text,
            "[debug] Unknown syntax node type 'mystery'\n",
        );
    });
});

async function talonFormatter(
    content: string,
    options: Options = {},
): Promise<string> {
    const node = await parseText(content, "tree-sitter-talon");
    return originalTalonFormatter(node, options, true);
}
