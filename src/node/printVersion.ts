import packageJson from "../../package.json" with { type: "json" };

export function printVersion(): void {
    process.stdout.write(`${packageJson.version}\n`);
}
