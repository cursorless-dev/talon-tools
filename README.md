# Talon tools

Linting and formatting tools for Talon and Cursorless.

## CLI

```sh
talon-fmt [options] [file/dir/glob ...]
snippet-fmt [options] [file/dir/glob ...]
tree-sitter-fmt [options] [file/dir/glob ...]
```

### Options

All binaries support these options:

| Option      | Meaning                          |
| ----------- | -------------------------------- |
| `--help`    | Show help                        |
| `--version` | Show version                     |
| `--check`   | Check formatting without writing |

Formatting options are read from [.editorconfig](https://editorconfig.org) based on the file path being
formatted. For stdin, the formatter resolves a synthetic file such as
`stdin.talon`, `stdin.talon-list`, `stdin.scm`, or `stdin.snippet` from the
current working directory and loads `.editorconfig` relative to that path.

Supported `.editorconfig` properties:

| Property          | Meaning                            |
| ----------------- | ---------------------------------- |
| `indent_style`    | Use tabs or spaces for indentation |
| `indent_size`     | Set indentation width              |
| `max_line_length` | Set preferred maximum line width   |
| `column_width`    | Set aligned left-column width      |

Use `--` to mark the end of options. Any following arguments are treated as
file, directory, or glob patterns even if they start with `--`.

```sh
talon-fmt -- --check
```

### Column width comment

The column width option can be enabled on a per file basis using a fmt comment.

```talon
# fmt: columnWidth=15

foo:           "foo"
foo bar baz:   "foo bar baz"
```

## Exit codes

| Code | Information                         |
| ---- | ----------------------------------- |
| 0    | Everything formatted properly       |
| 1    | Something wasn't formatted properly |
| 2    | Runtime error                       |

## Pre commit

```yaml
repos:
  - repo: https://github.com/cursorless-dev/talon-tools
    rev: v0.1.0
    hooks:
      - talon-fmt
      - snippet-fmt
      - tree-sitter-fmt
```

## Guidelines

- Each pre-commit hook should have a matching npm binary with the same name.
- Binaries ending with `-fmt` are formatters by default and turn into linters/checkers with the `--check` argument.
- (Future) binaries ending with `-check` are linters by default and turn into fixers with the `--fix` argument.
