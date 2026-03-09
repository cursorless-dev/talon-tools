# Talon tools

Linting and formatting tools for Talon and Cursorless.

## Guidelines

- Each pre-commit hook should have a matching npm binary with the same name.
- Binaries ending with `-fmt` are formatters by default and turn into linters/checkers with the `--check` argument.
- (Future) binaries ending with `-check` are linters by default and turn into fixers with the `--fix` argument.

## Exit codes

| Code | Information                         |
| ---- | ----------------------------------- |
| 0    | Everything formatted properly       |
| 1    | Something wasn’t formatted properly |
| 2    | Runtime error                       |
