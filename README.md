# Talon tools

Linting and formatting tools for Talon and Cursorless.

## CLI

```sh
talon-fmt [options] [file/dir/glob ...]
snippet-fmt [options] [file/dir/glob ...]
tree-sitter-fmt [options] [file/dir/glob ...]
```

### Options

| Option               | Meaning                          | Default |
| -------------------- | -------------------------------- | ------- |
| `--help`             | Show help                        |         |
| `--version`          | Show version                     |         |
| `--check`            | Check formatting without writing |         |
| `--indent-tabs`      | Use tabs for indentation         |         |
| `--indent-width <n>` | Set indentation width            | `4`     |
| `--line-width <n>`   | Set preferred maximum line width | `80`    |
| `--column-width <n>` | Set aligned left-column width    |         |

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
