import assert from "node:assert";
import { parseSnippetFile } from "../snippet/parseSnippetFile.js";
import type { SnippetFile } from "../snippet/snippetTypes.js";

suite("Snippet parser", () => {
    test("Full", testFull);
    test("Whitespace", testWhitespace);
    test("Name only", testNameOnly);
    test("Empty", testEmpty);
    test("Multiple documents", testMultipleDocuments);
    test("Multiple values", testMultipleValues);
    test("- in body", testDashInBody);
});

function testFull() {
    const fixture = `\
name: mySnippet
description: My snippet
phrase: try catch
language: javascript
insertionScope: statement
$0.wrapperScope: statement
$0.wrapperPhrase: try
$0.insertionFormatter: PASCAL_CASE
$1.wrapperPhrase: catch
$1.wrapperScope: statement
-
try {
    $1
} catch (ex) {
    $0
}
`;

    const expected: SnippetFile = {
        snippets: [
            {
                name: "mySnippet",
                description: "My snippet",
                phrases: ["try catch"],
                languages: ["javascript"],
                insertionScopes: ["statement"],
                body: ["try {", "    $1", "} catch (ex) {", "    $0", "}"],
                variables: [
                    {
                        name: "0",
                        wrapperPhrases: ["try"],
                        wrapperScope: "statement",
                        insertionFormatters: ["PASCAL_CASE"],
                    },
                    {
                        name: "1",
                        wrapperPhrases: ["catch"],
                        wrapperScope: "statement",
                    },
                ],
            },
        ],
    };

    const actual = parseSnippetFile(fixture);

    assert.deepEqual(actual, expected);
}

function testWhitespace() {
    const fixture = `
name: foo
-
  
  foo  
  
 bar 
baz `;

    const expected: SnippetFile = {
        snippets: [
            {
                name: "foo",
                body: ["  foo", "", " bar", "baz"],
                variables: [],
            },
        ],
    };

    const actual = parseSnippetFile(fixture);

    assert.deepEqual(actual, expected);
}

function testNameOnly() {
    const fixture = "name: mySnippet";
    const expected: SnippetFile = {
        header: {
            name: "mySnippet",
            variables: [],
        },
        snippets: [],
    };

    const actual = parseSnippetFile(fixture);

    assert.deepEqual(actual, expected);
}

function testEmpty() {
    const fixture = "";
    const expected: SnippetFile = {
        snippets: [],
    };
    const actual = parseSnippetFile(fixture);

    assert.deepEqual(actual, expected);
}

function testMultipleDocuments() {
    const fixture = `\
name: mySnippet
phrase: first 
-
foo
---

---

name: mySnippet2
phrase: second
-
bar`;

    const expected: SnippetFile = {
        snippets: [
            {
                name: "mySnippet",
                phrases: ["first"],
                body: ["foo"],
                variables: [],
            },
            {
                name: "mySnippet2",
                phrases: ["second"],
                body: ["bar"],
                variables: [],
            },
        ],
    };

    const actual = parseSnippetFile(fixture);

    assert.deepEqual(actual, expected);
}

function testMultipleValues() {
    const fixture = `\
name: mySnippet
phrase: first | second
language: javascript | java
insertionScope: function | statement
-
foo
`;

    const expected: SnippetFile = {
        snippets: [
            {
                name: "mySnippet",
                phrases: ["first", "second"],
                languages: ["javascript", "java"],
                insertionScopes: ["function", "statement"],
                body: ["foo"],
                variables: [],
            },
        ],
    };

    const actual = parseSnippetFile(fixture);

    assert.deepEqual(actual, expected);
}

function testDashInBody() {
    const fixture = `\
name: test
-
a
-
b
`;

    const expected: SnippetFile = {
        snippets: [
            {
                name: "test",
                body: ["a", "-", "b"],
                variables: [],
            },
        ],
    };

    const actual = parseSnippetFile(fixture);

    assert.deepEqual(actual, expected);
}
