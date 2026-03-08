import esbuild, { type BuildOptions } from "esbuild";

export async function build() {
    console.log("Running esbuild");

    const optionsCommon: BuildOptions = {
        bundle: true,
        format: "esm",
        platform: "node",
        outdir: "out",
    };

    await esbuild.build({
        ...optionsCommon,
        entryPoints: { lib: "src/lib.ts" },
        minify: true,
        sourcemap: true,
    });
}

void build().catch((e) => {
    console.error(e);
    process.exit(1);
});
