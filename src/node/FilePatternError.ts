export class FilePatternError extends Error {
    public name = "FilePatternError";

    public constructor(public messages: string[]) {
        super(
            `One or more file pattern errors occurred:\n${messages.join("\n")}`,
        );
    }
}
