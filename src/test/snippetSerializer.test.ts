import assert from "node:assert";
import { serializeSnippetFile } from "../snippet/serializeSnippetFile.js";
import type { SnippetFile } from "../snippet/snippetTypes.js";

suite("Snippet serializer", () => {
    test("Key order", testKeyOrder);
    test("Name only", testNameOnly);
    test("Multiple values", testMultipleValues);
    test("endOfLine: CRLF", testCrLf);
    test("insertFinalNewline: false", testNoFinalNewline);
});

function testKeyOrder() {
    const fixture: SnippetFile = {
        header: {
            variables: [
                {
                    wrapperScope: "statement",
                    wrapperPhrases: ["try"],
                    insertionFormatters: ["PASCAL_CASE"],
                    name: "0",
                },
                {
                    name: "foo",
                    wrapperPhrases: ["bar"],
                },
                {
                    wrapperScope: "statement",
                    wrapperPhrases: ["catch"],
                    name: "1",
                },
            ],
            insertionScopes: ["statement"],
            phrases: ["try catch"],
            languages: ["javascript"],
            name: "mySnippet",
        },
        snippets: [],
    };

    const expected = `\
name: mySnippet
language: javascript
phrase: try catch
insertionScope: statement

$1.wrapperPhrase: catch
$1.wrapperScope: statement
$foo.wrapperPhrase: bar
$0.insertionFormatter: PASCAL_CASE
$0.wrapperPhrase: try
$0.wrapperScope: statement
---
`;

    const actual = serializeSnippetFile(fixture);

    assert.equal(actual, expected);
}

function testNameOnly() {
    const fixture: SnippetFile = {
        header: {
            name: "mySnippet",
            variables: [],
        },
        snippets: [],
    };

    const expected = `\
name: mySnippet
---
`;

    const actual = serializeSnippetFile(fixture);

    assert.equal(actual, expected);
}

function testMultipleValues() {
    const fixture: SnippetFile = {
        snippets: [
            {
                name: "mySnippet",
                description: "My snippet",
                phrases: ["first", "second"],
                languages: ["javascript", "java"],
                insertionScopes: ["function", "statement"],
                body: ["foo"],
                variables: [],
            },
        ],
    };

    const expected = `\
name: mySnippet
description: My snippet
language: javascript | java
phrase: first | second
insertionScope: function | statement
-
foo
---
`;

    const actual = serializeSnippetFile(fixture);

    assert.deepEqual(actual, expected);
}

function testCrLf() {
    const fixture: SnippetFile = {
        header: {
            name: "mySnippet",
            variables: [],
        },
        snippets: [],
    };

    const actual = serializeSnippetFile(fixture, {
        endOfLine: "crlf",
    });

    assert.equal(actual, "name: mySnippet\r\n---\r\n");
}

function testNoFinalNewline() {
    const fixture: SnippetFile = {
        header: {
            name: "mySnippet",
            variables: [],
        },
        snippets: [],
    };

    const actual = serializeSnippetFile(fixture, {
        insertFinalNewline: false,
    });

    assert.equal(actual, "name: mySnippet\n---");
}
