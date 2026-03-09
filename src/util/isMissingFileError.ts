export function isMissingFileError(error: unknown) {
    return (
        typeof error === "object" &&
        error != null &&
        "code" in error &&
        error.code === "ENOENT"
    );
}
