# Talon tools

Linting and formatting tools for Talon and Cursorless.

## CLI

```sh
talon-fmt [options] [file/dir/glob ...]
snippet-fmt [options] [file/dir/glob ...]
tree-sitter-fmt [options] [file/dir/glob ...]
```

### Options

All binaries support these global options:

| Option      | Meaning                          |
| ----------- | -------------------------------- |
| `--help`    | Show help                        |
| `--version` | Show version                     |
| `--check`   | Check formatting without writing |

`talon-fmt` also supports:

| Option               | Meaning                          | Default |
| -------------------- | -------------------------------- | ------- |
| `--indent-tabs`      | Use tabs for indentation         |         |
| `--indent-width <n>` | Set indentation width            | `4`     |
| `--line-width <n>`   | Set preferred maximum line width | `80`    |
| `--column-width <n>` | Set aligned left-column width    |         |

`tree-sitter-fmt` also supports:

| Option               | Meaning                  | Default |
| -------------------- | ------------------------ | ------- |
| `--indent-tabs`      | Use tabs for indentation |         |
| `--indent-width <n>` | Set indentation width    | `4`     |

`snippet-fmt` does not support any additional formatter-specific options.

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
