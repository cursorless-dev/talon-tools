import * as assert from "node:assert";
import { talonListFormatter } from "../talon/talonListFormatter.js";
import { getFixture, getFixtures } from "./testUtils.js";

suite("Talon list formatter", () => {
    for (const fixture of getFixtures("talonListFixtures")) {
        test(fixture.title, () => {
            const { input, expected } = getFixture(fixture.file);
            const actual = talonListFormatter(input);
            assert.equal(actual, expected);
        });
    }

    test("CRLF input", () => {
        const actual = talonListFormatter("list: l\r\n-\r\na:b");
        assert.equal(actual, "list: l\n-\n\na: b\n");
    });

    test("endOfLine: CRLF", () => {
        const actual = talonListFormatter("list: l\n-\na:b", {
            endOfLine: "crlf",
        });
        assert.equal(actual, "list: l\r\n-\r\n\r\na: b\r\n");
    });

    test("columnWidth: 10", () => {
        const actual = talonListFormatter("list: l\n-\na:b", {
            columnWidth: 10,
        });
        assert.equal(actual, "list: l\n-\n\na:        b\n");
    });

    test("insertFinalNewline: false", () => {
        const actual = talonListFormatter("list: l\n-\na:b", {
            insertFinalNewline: false,
        });
        assert.equal(actual, "list: l\n-\n\na: b");
    });

    test("preserves key-only items", () => {
        const actual = talonListFormatter("list: l\n-\na", {});

        assert.equal(actual, "list: l\n-\n\na\n");
    });
});
