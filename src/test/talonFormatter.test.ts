import * as assert from "node:assert";
import { talonFormatter } from "../talon/talonFormatter.js";
import { parseText } from "../util/parseText.js";

type Content = string | string[];

const fixtures: { title: string; pre: Content; post: Content }[] = [
    {
        title: "matchers",
        pre: ["app  :  vscode", "", "and  not  mode :  command", "-", ""],
        post: ["app: vscode", "", "and not mode: command", "-", ""],
    },

    {
        title: "command singe line",
        pre: "foo  :  edit.left(  )",
        post: ["foo:                        edit.left()", ""],
    },

    {
        title: "command multi line",
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
        title: "settings declaration",
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
        title: "tag/key/gamepad/parrot/face declarations",
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
            "key(enter):                 'key'",
            "gamepad(north):             'gamepad'",
            "parrot(pop):                'parrot'",
            "noise(pop):                 'noise'",
            "face(smile):                'face'",
            "",
        ],
    },

    {
        title: "CRLF comment",
        pre: "# Hello\r\nfoo: 'bar'",
        post: "# Hello\nfoo:                        'bar'\n",
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
                columnWidth: 28,
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
        });

        assert.equal(actual, "foo:\n\tedit.left()\n");
    });

    test("indentWidth: 2", async () => {
        const rootNode = await parseText(
            "foo:\n  edit.left()",
            "tree-sitter-talon",
        );

        const actual = talonFormatter(rootNode, {
            indentWidth: 2,
        });

        assert.equal(actual, "foo:\n  edit.left()\n");
    });

    test("lineWidth: 7", async () => {
        const rootNode = await parseText("aaa: bbb", "tree-sitter-talon");

        const actual = talonFormatter(rootNode, {
            lineWidth: 7,
        });

        assert.equal(actual, "aaa:\n    bbb\n");
    });

    test("lineWidth: default", async () => {
        const right = `"${"a".repeat(76)}"`;
        const rootNode = await parseText(`foo: ${right}`, "tree-sitter-talon");

        const actual = talonFormatter(rootNode);

        assert.equal(actual, `foo:\n    ${right}\n`);
    });
});

function getContentString(content: Content): string {
    return Array.isArray(content) ? content.join("\n") : content;
}
