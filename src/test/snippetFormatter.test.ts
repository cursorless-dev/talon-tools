import * as assert from "node:assert";
import { snippetFormatter } from "../snippet/snippetFormatter.js";
import { getFixture, getFixtures } from "./testUtils.js";

suite("Snippet formatter", () => {
    for (const fixture of getFixtures("snippetFixtures")) {
        test(fixture.title, () => {
            const { input, expected } = getFixture(fixture.file);
            const actual = snippetFormatter(input);
            assert.equal(actual, expected);
        });
    }

    test("CRLF input", () => {
        const actual = snippetFormatter("name: foo\r\n-\r\nbar");
        assert.equal(actual, "name: foo\n-\nbar\n---\n");
    });

    test("endOfLine: CRLF", () => {
        const actual = snippetFormatter("name: foo\n-\nbar", {
            endOfLine: "crlf",
        });
        assert.equal(actual, "name: foo\r\n-\r\nbar\r\n---\r\n");
    });
});
