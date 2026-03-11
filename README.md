# Talon tools

Linting and formatting tools for Talon and Cursorless.

## Command line

```sh
talon-fmt [options] [file/dir/glob ...]
snippet-fmt [options] [file/dir/glob ...]
tree-sitter-fmt [options] [file/dir/glob ...]
```

### CLI options

All binaries support these options:

| Option      | Meaning                          |
| ----------- | -------------------------------- |
| `--help`    | Show help                        |
| `--version` | Show version                     |
| `--quiet`   | Suppress non-error output        |
| `--check`   | Check formatting without writing |
| `--debug`   | Print debug output               |

Use `--debug` when diagnosing parser or formatter support for new syntax.

## Formatting options

Formatting options are read from [.editorconfig](https://editorconfig.org) based on the file path being
formatted. For stdin, the formatter resolves a synthetic file such as
`stdin.talon`, `stdin.talon-list`, `stdin.scm`, or `stdin.snippet` from the
current working directory and loads `.editorconfig` relative to that path.

Supported `.editorconfig` properties:

| Property               | Meaning                             | Default  | `talon-fmt` | `snippet-fmt` | `tree-sitter-fmt` |
| ---------------------- | ----------------------------------- | -------- | ----------- | ------------- | ----------------- |
| `end_of_line`          | Set output line endings             | `lf`     | yes         | yes           | yes               |
| `indent_style`         | Use tabs or spaces for indentation  | `spaces` | yes         | no            | yes               |
| `indent_size`          | Set indentation width               | `4`      | yes         | no            | yes               |
| `max_line_length`      | Set preferred maximum line width    | `80`     | yes         | no            | no                |
| `insert_final_newline` | Ensure the file ends with a newline | `true`   | yes         | yes           | yes               |
| `preserve_multiline`   | Keep existing multi-line formatting | `false`  | yes         | no            | no                |
| `column_width`         | Set aligned left-column width       |          | yes         | no            | no                |

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
    rev: v0.5.0
    hooks:
      - id: talon-fmt
      - id: snippet-fmt
      - id: tree-sitter-fmt
```

## Guidelines

- Each pre-commit hook should have a matching npm binary with the same name.
- Binaries ending with `-fmt` are formatters by default and turn into linters/checkers with the `--check` argument.
- (Future) binaries ending with `-check` are linters by default and turn into fixers with the `--fix` argument.

## Developer

```sh
# Try formatter without pre-commit
node out/treeSitterFormatter.js test.scm

# Try formatter with pre-commit
pre-commit try-repo . tree-sitter-fmt --files test.scm -v
```
