import * as assert from "node:assert";
import { snippetFormatter } from "../snippet/snippetFormatter.js";

type Content = string | string[];

const fixtures: {
    title: string;
    pre: Content;
    post: Content;
}[] = [
    {
        title: "Empty lines",
        pre: `
name: foo
-
  
  foo  
  
 bar 
baz `,
        post: `\
name: foo
-
  foo

 bar
baz
---
`,
    },
    {
        title: "Empty snippet document",
        pre: `\
name: test
---

---
phrase: test
-
test
`,
        post: `\
name: test
---

phrase: test
-
test
---
`,
    },
    {
        title: "Empty file",
        pre: "",
        post: "",
    },
    {
        title: "Large file",
        pre: `\

name:tryCatchStatement
insertionScope: statement|namedFunction
phrase   :  try catch  |  try


$1.insertionFormatter: PASCAL_CASE
$1.wrapperPhrase:try|trying
$1.wrapperScope  :   statement
    $0.wrapperPhrase:catch
    $0.wrapperScope :statement
---
language: javascript|  java
-

try {
    $1 
}
catch(error) {
    $0 
} ---
a: b 
---

language: python
-

try:
    $1
except Exception as ex:
    $0`,
        post: `\
name: tryCatchStatement
phrase: try catch | try
insertionScope: statement | namedFunction

$1.insertionFormatter: PASCAL_CASE
$1.wrapperPhrase: try | trying
$1.wrapperScope: statement
$0.wrapperPhrase: catch
$0.wrapperScope: statement
---

language: javascript | java
-
try {
    $1
}
catch(error) {
    $0
} ---
a: b
---

language: python
-
try:
    $1
except Exception as ex:
    $0
---
`,
    },
];

suite("Snippet formatter", () => {
    for (const fixture of fixtures) {
        test(fixture.title, function () {
            const content = getContentString(fixture.pre);
            const actual = snippetFormatter(content);
            const expected = getContentString(fixture.post);
            assert.equal(actual, expected);
        });
    }

    test("endOfLine: CRLF", () => {
        const actual = snippetFormatter("name: foo", {
            endOfLine: "crlf",
        });

        assert.equal(actual, "name: foo\r\n---\r\n");
    });
});

function getContentString(content: Content): string {
    return Array.isArray(content) ? content.join("\n") : content;
}
