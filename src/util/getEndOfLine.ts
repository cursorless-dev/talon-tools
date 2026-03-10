import type { EndOfLine } from "../types.js";

export function getEndOfLine(eof?: EndOfLine): string {
    return eof === "crlf" ? "\r\n" : "\n";
}
