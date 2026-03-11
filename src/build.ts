import esbuild, { type BuildOptions } from "esbuild";

export async function build() {
    console.log("Running esbuild...");

    const options: BuildOptions = {
        bundle: true,
        format: "esm",
        outdir: "dist",
        minify: true,
        sourcemap: true,
        packages: "external",
    };

    await esbuild.build({
        ...options,
        platform: "neutral",
        entryPoints: {
            lib: "src/lib.ts",
        },
    });

    await esbuild.build({
        ...options,
        platform: "node",
        entryPoints: {
            libNode: "src/node/libNode.ts",
            snippetFormatter: "src/node/snippetFormatter.ts",
            talonFormatter: "src/node/talonFormatter.ts",
            treeSitterFormatter: "src/node/treeSitterFormatter.ts",
        },
    });
}

void build().catch((e) => {
    console.error(e);
    process.exit(1);
});
