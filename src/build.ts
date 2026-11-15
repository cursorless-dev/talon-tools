import { exit } from "node:process";
import esbuild from "esbuild";
import type { BuildOptions } from "esbuild";
import { bundleAssets } from "./bundleAssets.js";

async function build(): Promise<void> {
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

try {
    await build();
    await bundleAssets();
} catch (error) {
    console.error(error);
    exit(1);
}
