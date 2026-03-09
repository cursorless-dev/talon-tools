import esbuild from "esbuild";

export async function build() {
    console.log("Running esbuild");

    await esbuild.build({
        bundle: true,
        format: "esm",
        platform: "node",
        outdir: "out",
        minify: true,
        sourcemap: true,

        entryPoints: {
            lib: "src/lib/index.ts",
            snippetFormatter: "src/cli/snippetFormatter.ts",
            talonFormatter: "src/cli/talonFormatter.ts",
            treeSitterFormatter: "src/cli/treeSitterFormatter.ts",
        },
    });
}

void build().catch((e) => {
    console.error(e);
    process.exit(1);
});
