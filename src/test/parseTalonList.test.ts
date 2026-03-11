import assert from "node:assert";
import { parseTalonList, type TalonList } from "../talon/parseTalonList.js";

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
                { type: "item", key: "air", value: "a" },
                { type: "item", key: "bat", value: undefined },
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
                { type: "item", key: "air", value: "a" },
                { type: "empty" },
                { type: "item", key: "bat", value: "b" },
            ],
        };

        const actual = parseTalonList(fixture);

        assert.deepEqual(actual, expected);
    });

    test("Supports CRLF input", () => {
        const actual = parseTalonList("list: user.my_list\r\n-\r\na: b");

        assert.deepEqual(actual, {
            headers: [{ type: "header", key: "list", value: "user.my_list" }],
            items: [{ type: "item", key: "a", value: "b" }],
        });
    });

    test("Throws when separator is missing", () => {
        assert.throws(
            () => parseTalonList("list: user.my_list"),
            /Separator not found in talon list/,
        );
    });

    test("Throws when a header value is missing", () => {
        assert.throws(
            () => parseTalonList("list\n-\na: b"),
            /Header value missing/,
        );
    });
});
