// Exit code 0: Success
export const EXIT_OK = 0;
// Exit code 1: Check failed
export const EXIT_FAIL = 1;
// Exit code 2: Unexpected error
export const EXIT_ERROR = 2;

export const DEFAULT_INDENT_WIDTH = 4;
export const DEFAULT_MAX_LINE_LENGTH = 80;
export const DEFAULT_INSERT_FINAL_NEWLINE = true;

const IGNORE_FOLDERS = [".git", ".svn", ".hg", "node_modules", "__pycache__"];

export const GIT_IGNORE_PATTERNS = IGNORE_FOLDERS.map((folder) => `${folder}/`);

export const GLOB_IGNORE_PATTERNS = IGNORE_FOLDERS.map(
    (pattern) => `**/${pattern}/**`,
);
