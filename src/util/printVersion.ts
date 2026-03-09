import packageJson from "../../package.json" with { type: "json" };

export function printVersion() {
    console.log(packageJson.version);
}
