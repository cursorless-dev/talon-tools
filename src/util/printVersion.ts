import packageJson from "../../package.json" with { type: "json" };

export function printVersion() {
    process.stdout.write(`${packageJson.version}\n`);
}
