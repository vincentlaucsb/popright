import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "dist-demo");
const assets = path.join(out, "assets", "core");

await rm(out, { recursive: true, force: true });
await mkdir(assets, { recursive: true });

const sourceHtml = await readFile(path.join(root, "examples", "vanilla", "index.html"), "utf8");
const sourceScript = await readFile(path.join(root, "examples", "vanilla", "demo.js"), "utf8");
const builtHtml = sourceHtml.replace(
  "../../packages/core/src/styles/popright.css",
  "./assets/core/popright.css"
);
const builtScript = sourceScript.replace(
  "../../packages/core/dist/index.js",
  "./assets/core/index.js"
);

await writeFile(path.join(out, "index.html"), builtHtml);
await writeFile(path.join(out, "demo.js"), builtScript);
await cp(path.join(root, "packages", "core", "dist"), assets, { recursive: true });
await rm(path.join(assets, "styles.css"), { force: true });
await cp(path.join(root, "packages", "core", "dist", "styles.css"), path.join(assets, "popright.css"));
await writeFile(path.join(out, "favicon.ico"), "");

await build({
  root: path.join(root, "examples", "react"),
  base: "./",
  build: {
    outDir: path.join(out, "react"),
    emptyOutDir: true
  }
});

console.log(`Demo built to ${out}`);
