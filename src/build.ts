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
            talonFormatter: "src/cli/talonFormatter.ts",
            talonListFormatter: "src/cli/talonListFormatter.ts",
            talonSnippetFormatter: "src/cli/talonSnippetFormatter.ts",
            treeSitterQueryFormatter: "src/cli/treeSitterQueryFormatter.ts",
        },
    });
}

void build().catch((e) => {
    console.error(e);
    process.exit(1);
});
