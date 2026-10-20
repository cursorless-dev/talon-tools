import assert from "node:assert";
import { parseTalonList } from "../talon/parseTalonList.js";
import type { TalonList } from "../talon/parseTalonList.js";

suite("parseTalonList", () => {
    test("Parses headers, comments, and items", () => {
        const fixture = `\
# header
list: user.my_list
tag: user.test
-

# body
air: a
bat
`;

        const expected: TalonList = {
            headers: [
                { type: "comment", text: "# header" },
                { type: "header", key: "list", value: "user.my_list" },
                { type: "header", key: "tag", value: "user.test" },
            ],
            items: [
                { type: "comment", text: "# body" },
                { type: "item", key: "air", valueLines: ["a"] },
                { type: "item", key: "bat", valueLines: [] },
            ],
        };

        const actual = parseTalonList(fixture);

        assert.deepEqual(actual, expected);
    });

    test("trims leading and trailing blank body lines but preserves internal blanks", () => {
        const fixture = `\
list : user.my_list
-


air : a

bat: b


`;

        const expected: TalonList = {
            headers: [{ type: "header", key: "list", value: "user.my_list" }],
            items: [
                { type: "item", key: "air", valueLines: ["a"] },
                { type: "empty" },
                { type: "item", key: "bat", valueLines: ["b"] },
            ],
        };

        const actual = parseTalonList(fixture);

        assert.deepEqual(actual, expected);
    });

    test("Supports CRLF input", () => {
        const actual = parseTalonList("list: user.my_list\r\n-\r\na: b");

        assert.deepEqual(actual, {
            headers: [{ type: "header", key: "list", value: "user.my_list" }],
            items: [{ type: "item", key: "a", valueLines: ["b"] }],
        });
    });

    test("Collects indented values without interpreting their content", () => {
        const actual = parseTalonList(
            'list: l\n-\na:\n  """b:c\n  # content\n\n    extra spaces  \n  d"""\n\nbat: b\nempty:\ncat',
        );
        assert.deepEqual(actual.items, [
            {
                type: "item",
                key: "a",
                valueLines: [
                    "",
                    '"""b:c',
                    "# content",
                    "",
                    "  extra spaces  ",
                    'd"""',
                ],
            },
            { type: "empty" },
            { type: "item", key: "bat", valueLines: ["b"] },
            { type: "item", key: "empty", valueLines: [""] },
            { type: "item", key: "cat", valueLines: [] },
        ]);
    });

    test("Uses the first nonblank line to determine block indentation", () => {
        for (const blankLine of ["      ", "", "\t"]) {
            const actual = parseTalonList(
                `list: l\n-\na:\n${blankLine}\n  """hello\n  world"""\nb: c`,
            );
            assert.deepEqual(actual.items, [
                {
                    type: "item",
                    key: "a",
                    valueLines: ["", "", '"""hello', 'world"""'],
                },
                { type: "item", key: "b", valueLines: ["c"] },
            ]);
        }
    });

    test("Keeps whitespace-only lines outside an empty value", () => {
        const actual = parseTalonList("list: l\n-\na:\n  \n    \nb: c");
        assert.deepEqual(actual.items, [
            { type: "item", key: "a", valueLines: [""] },
            { type: "empty" },
            { type: "empty" },
            { type: "item", key: "b", valueLines: ["c"] },
        ]);
    });

    test("Throws when separator is missing", () => {
        assert.throws(
            () => parseTalonList("list: user.my_list"),
            /Separator not found in talon list/u,
        );
    });

    test("Throws when a header value is missing", () => {
        assert.throws(
            () => parseTalonList("list\n-\na: b"),
            /Header value missing/u,
        );
    });
});
