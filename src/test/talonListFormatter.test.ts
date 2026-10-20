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
        const actual = talonListFormatter(
            'list: l\r\n-\r\na:\r\n  """b:c\r\n  d"""',
        );
        assert.equal(actual, 'list: l\n-\n\na:\n    """b:c\n    d"""\n');
    });

    test("CRLF comment", () => {
        const actual = talonListFormatter(
            'list: l\r\n-\r\n# Hello\r\nfoo: "bar"',
        );
        assert.equal(actual, 'list: l\n-\n\n# Hello\nfoo: "bar"\n');
    });

    test("endOfLine: CRLF", () => {
        const actual = talonListFormatter('list: l\n-\na:\n  """b\n  c"""', {
            endOfLine: "crlf",
        });
        assert.equal(
            actual,
            'list: l\r\n-\r\n\r\na:\r\n    """b\r\n    c"""\r\n',
        );
    });

    test("columnWidth: 10", () => {
        const actual = talonListFormatter("list: l\n-\na:b", {
            columnWidth: 10,
        });
        assert.equal(actual, "list: l\n-\n\na:        b\n");
    });

    test("Formats multiline indentation using options", () => {
        const input = 'list: l\n-\na:\n  """b\n  c"""';
        assert.equal(
            talonListFormatter(input, {
                indentSize: 2,
                insertFinalNewline: false,
            }),
            'list: l\n-\n\na:\n  """b\n  c"""',
        );
        assert.equal(
            talonListFormatter(input, { indentTabs: true, columnWidth: 10 }),
            'list: l\n-\n\na:\n\t"""b\n\tc"""\n',
        );
    });

    test("insertFinalNewline: false", () => {
        const actual = talonListFormatter("list: l\n-\na:b", {
            insertFinalNewline: false,
        });
        assert.equal(actual, "list: l\n-\n\na: b");
    });
});
