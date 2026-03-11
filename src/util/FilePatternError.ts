export class FilePatternError extends Error {
    name = "FilePatternError";

    constructor(public messages: string[]) {
        super(
            `One or more file pattern errors occurred:\n${messages.join("\n")}`,
        );
    }
}
