import * as assert from "node:assert";
import { talonFormatter } from "../talon/talonFormatter.js";
import { parseText } from "../util/parseText.js";
import type { Content } from "./testUtils.js";
import {
    captureStreamWrite,
    createNode,
    getContentString,
} from "./testUtils.js";

const fixtures: {
    title: string;
    columnWidth?: number;
    pre: Content;
    post: Content;
}[] = [
    {
        title: "Matchers",
        pre: ["app  :  vscode", "", "and  not  mode :  command", "-", ""],
        post: ["app: vscode", "", "and not mode: command", "-", ""],
    },

    {
        title: "Command single line",
        pre: "foo  :  edit.left(  )",
        post: ["foo: edit.left()", ""],
    },

    {
        title: "Empty header",
        pre: "\n-\na:b",
        post: "a: b\n",
    },

    {
        title: "Pipe padding",
        pre: "a|b:c",
        post: "a | b: c\n",
    },

    {
        title: "Unnecessary parentheses",
        pre: "(a):b",
        post: "a: b\n",
    },

    {
        title: "Comment before divider",
        pre: "# a\n-\nb: c",
        post: "# a\n-\nb: c\n",
    },

    {
        title: "Command multi line",
        pre: [
            "foo  : ",
            "  # actions",
            "  edit.left(  )",
            "  key(  enter  )",
            "  sleep(   200ms  )",
            "  user.too_stuff(  5  ,  7  ,  true  ,  false  )",
        ],
        post: [
            "foo:",
            "    # actions",
            "    edit.left()",
            "    key(enter)",
            "    sleep(200ms)",
            "    user.too_stuff(5, 7, true, false)",
            "",
        ],
    },

    {
        title: "Settings declaration",
        pre: [
            "settings()  :  ",
            "  speech.timeout  =  0.400",
            "",
            "  speech.record_all=true",
        ],
        post: [
            "settings():",
            "    speech.timeout = 0.400",
            "",
            "    speech.record_all = true",
            "",
        ],
    },

    {
        title: "Tag/key/gamepad/parrot/face declarations",
        pre: [
            "tag()  :  user.some_tag",
            "key( enter )  :  'key'",
            "gamepad( north )  :  'gamepad'",
            "parrot( pop )  :  'parrot'",
            "noise( pop )  :  'noise'",
            "face( smile )  :  'face'",
        ],
        post: [
            "tag(): user.some_tag",
            "key(enter): 'key'",
            "gamepad(north): 'gamepad'",
            "parrot(pop): 'parrot'",
            "noise(pop): 'noise'",
            "face(smile): 'face'",
            "",
        ],
    },

    {
        title: "CRLF comment",
        pre: "# Hello\r\nfoo: 'bar'",
        post: "# Hello\nfoo: 'bar'\n",
    },

    {
        title: "Indented comment",
        pre: "# settings():\n # insert_wait = 10",
        post: "# settings():\n    # insert_wait = 10\n",
    },

    {
        title: "Custom column width",
        pre: "# fmt: columnWidth=5\nfoo: 'bar'",
        post: "# fmt: columnWidth=5\nfoo: 'bar'\n",
    },

    {
        title: "Large file",
        columnWidth: 28,
        pre: `\
not   mode  : command
tag :  stuff
-

some command : 
    # stuff
    edit.left(  )
    key(  enter  )
    key(  enter  )
    sleep(   200ms  )
    user.too_stuff( 5 ,  7  , true  ,  false  ) 
    
command    :                    "command"

# hello


tag() :  user.some_tag

settings() :
    speech.debug  =  1
    speech.stuff  =  1

key(  enter  )  :        "enter hello"
gamepad(  north  )  :         "north"
face(  smile  )  :        "smile"
parrot(  pop  )  :           "pop"
noise(  pop  )  :         "noise"
deck(  stuff  )  :      "deck"

slap  :
    key(  end  )
    key(  enter  )

# Uncomment this to enable the curse yes/curse no commands (show hide mouse cursor). See issue #688.
# tag(): user.mouse_cursor_commands_enable`,
        post: `\
not mode: command
tag: stuff
-

some command:
    # stuff
    edit.left()
    key(enter)
    key(enter)
    sleep(200ms)
    user.too_stuff(5, 7, true, false)

command:                    "command"

# hello

tag(): user.some_tag

settings():
    speech.debug = 1
    speech.stuff = 1

key(enter):                 "enter hello"
gamepad(north):             "north"
face(smile):                "smile"
parrot(pop):                "pop"
noise(pop):                 "noise"
deck(stuff):                "deck"

slap:
    key(end)
    key(enter)

# Uncomment this to enable the curse yes/curse no commands (show hide mouse cursor). See issue #688.
# tag(): user.mouse_cursor_commands_enable
`,
    },
];

suite("Talon formatter", () => {
    for (const fixture of fixtures) {
        test(fixture.title, async () => {
            const content = getContentString(fixture.pre);
            const rootNode = await parseText(content, "tree-sitter-talon");
            const actual = talonFormatter(rootNode, {
                columnWidth: fixture.columnWidth,
            });
            const expected = getContentString(fixture.post);
            assert.equal(actual, expected);
        });
    }

    test("endOfLine: CRLF", async () => {
        const rootNode = await parseText(
            "foo:\n  edit.left()",
            "tree-sitter-talon",
        );
        const actual = talonFormatter(rootNode, {
            endOfLine: "crlf",
            preserveMultiline: true,
        });
        assert.equal(actual, "foo:\r\n    edit.left()\r\n");
    });

    test("indentTabs: true", async () => {
        const rootNode = await parseText(
            "foo:\n  edit.left()",
            "tree-sitter-talon",
        );
        const actual = talonFormatter(rootNode, {
            indentTabs: true,
            preserveMultiline: true,
        });
        assert.equal(actual, "foo:\n\tedit.left()\n");
    });

    test("indentSize: 2", async () => {
        const rootNode = await parseText(
            "foo:\n  edit.left()",
            "tree-sitter-talon",
        );

        const actual = talonFormatter(rootNode, {
            indentSize: 2,
            preserveMultiline: true,
        });
        assert.equal(actual, "foo:\n  edit.left()\n");
    });

    test("insertFinalNewline: false", async () => {
        const rootNode = await parseText(
            "foo:\n  edit.left()",
            "tree-sitter-talon",
        );
        const actual = talonFormatter(rootNode, {
            insertFinalNewline: false,
        });
        assert.equal(actual, "foo: edit.left()");
    });

    test("maxLineLength: 7", async () => {
        const rootNode = await parseText("aaa: bbb", "tree-sitter-talon");
        const actual = talonFormatter(rootNode, {
            maxLineLength: 7,
        });
        assert.equal(actual, "aaa:\n    bbb\n");
    });

    test("maxLineLength: default", async () => {
        const right = `"${"a".repeat(76)}"`;
        const rootNode = await parseText(`foo: ${right}`, "tree-sitter-talon");
        const actual = talonFormatter(rootNode);
        assert.equal(actual, `foo:\n    ${right}\n`);
    });

    test("preserveMultiline: true", async () => {
        const rootNode = await parseText("aaa:\n    bbb", "tree-sitter-talon");
        const actual = talonFormatter(rootNode, {
            preserveMultiline: true,
        });
        assert.equal(actual, "aaa:\n    bbb\n");
    });

    test("Debug logs unknown syntax node types", async () => {
        const rootNode = createNode("mystery", "value");
        const output = await captureStreamWrite(process.stderr, () =>
            talonFormatter(rootNode, {}, true),
        );
        assert.equal(output.result, "value\n");
        assert.equal(
            output.text,
            "[debug] Unknown syntax node type 'mystery'\n",
        );
    });
});
