export function setExitCode(code: number): void {
    Reflect.set(process, "exitCode", code);
}
