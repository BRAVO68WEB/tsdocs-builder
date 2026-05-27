import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  outfile: "bin/tsdocs",
  format: "esm",
  minify: false,
  sourcemap: true,
  external: ["ts-morph"],
});

console.log("CLI binary built to bin/tsdocs");
