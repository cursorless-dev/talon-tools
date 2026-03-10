import * as assert from "node:assert";
import { treeSitterFormatter } from "../treeSitterFormatter.js";
import type { SyntaxNode } from "../types.js";
import { parseText } from "../util/parseText.js";

type Content = string | string[];

const fixtures: { title: string; pre: Content; post: Content }[] = [
    {
        title: "Named nodes",
        pre: ["(aaa", "    (bbb", "      (ccc)", "    ", ")", ")"],
        post: ["(aaa", "    (bbb", "        (ccc)", "    )", ")", ""],
    },
    {
        title: "Anonymous node",
        pre: '";" ?  @namedFunction.end  @functionName.domain.end',
        post: '";"? @namedFunction.end @functionName.domain.end\n',
    },
    {
        title: "Field definition in root",
        pre: ";;\nlhs: (rhs)",
        post: ";;\n(_\n    lhs: (rhs)\n)\n",
    },
    {
        title: "Trailing comment ws",
        pre: ";; Hello world ",
        post: ";; Hello world\n",
    },
    {
        title: "Trailing ?",
        pre: '(("." (type))?)?',
        post: `\
(
    (
        "."
        (type)
    )?
)?
`,
    },
    {
        title: "Large file",
        pre: `\
;; Define this here because the 'field_definition' node type doesn't exist
;; in typescript.
(
    ;;!! class Foo {
    ;;!!   foo = () => {};
    ;;!    ^^^^^^^^^^^^^^^
   ;;!!   foo = function() {};
    ;;!    ^^^^^^^^^^^^^^^^^^^^
    ;;!!   foo = function *() {};
    ;;!    ^^^^^^^^^^^^^^^^^^^^^^
    ;;!! }
  (field_definition
    property:(_)@functionName
    value:[
        (function
        !name
        )
        (generator_function
        !name
        )
        (arrow_function)
    ]
    )@namedFunction.start   @functionName.domain.start
    .
    ";" ?@namedFunction.end  @functionName.domain.end
)`,
        post: `\
;; Define this here because the 'field_definition' node type doesn't exist
;; in typescript.
(
    ;;!! class Foo {
    ;;!!   foo = () => {};
    ;;!    ^^^^^^^^^^^^^^^
    ;;!!   foo = function() {};
    ;;!    ^^^^^^^^^^^^^^^^^^^^
    ;;!!   foo = function *() {};
    ;;!    ^^^^^^^^^^^^^^^^^^^^^^
    ;;!! }
    (field_definition
        property: (_) @functionName
        value: [
            (function
                !name
            )
            (generator_function
                !name
            )
            (arrow_function)
        ]
    ) @namedFunction.start @functionName.domain.start
    .
    ";"? @namedFunction.end @functionName.domain.end
)
`,
    },
];

suite("Tree-sitter formatter", () => {
    for (const fixture of fixtures) {
        test(fixture.title, async () => {
            const content = getContentString(fixture.pre);
            const rootNode = await parseText(content, "tree-sitter-query");
            const actual = treeSitterFormatter(rootNode, {});
            const expected = getContentString(fixture.post);
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

function getContentString(content: Content): string {
    return Array.isArray(content) ? content.join("\n") : content;
}

function createNode(type: string, text: string): SyntaxNode {
    return {
        id: 1,
        type,
        text,
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: text.length },
        children: [],
    };
}

async function captureStreamWrite<T>(
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
