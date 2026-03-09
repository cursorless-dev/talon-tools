import * as assert from "node:assert";
import { talonListFormatter } from "../lib/talonListFormatter.js";
import { getDefaultOptions } from "../util/getDefaultArguments.js";

const fixtures: {
    title: string;
    pre: string;
    post: string;
}[] = [
    {
        title: "large",
        pre: `
list :user.my_list

-
    air   :a

bat: b`,
        post: `list: user.my_list
-

air:      a

bat:      b
`,
    },

    {
        title: "Multiple headers",
        pre: "app: app\nlist: l\n-\na:b",
        post: "list: l\napp: app\n-\n\na:        b\n",
    },

    {
        title: "To much whitespace",
        pre: "\n\nlist: l\n\n\n-\n\n\na:b\n\n",
        post: "list: l\n-\n\na:        b\n",
    },

    {
        title: "Comment",
        pre: "\n\nlist: l\n-\n#c:c\na:b",
        post: "list: l\n-\n\n#c:c\na:        b\n",
    },

    {
        title: "CRLF",
        pre: "list: l\r\n-\r\na:b",
        post: "list: l\n-\n\na:        b\n",
    },

    {
        title: "Custom column width",
        pre: "list: l\n-\n# fmt: columnWidth=5\na:b",
        post: "list: l\n-\n\n# fmt: columnWidth=5\na:   b\n",
    },
];

suite("Talon list formatter", () => {
    for (const fixture of fixtures) {
        test(fixture.title, () => {
            const actual = talonListFormatter(fixture.pre, {
                ...getDefaultOptions(),
                columnWidth: 10,
            });
            assert.equal(actual, fixture.post);
        });
    }
});
