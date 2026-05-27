import * as esbuild from "esbuild";

await esbuild.build({
 entryPoints: ["src/index.ts"],
 bundle: true,
 platform: "node",
 target: "node18",
 outfile: "bin/tsdocs",
 format: "esm",
 banner: { js: "#!/usr/bin/env node" },
 minify: false,
 sourcemap: true,
});

console.log("Binary built to bin/tsdocs");
