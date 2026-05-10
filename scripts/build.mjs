import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");
const jsBanner = `/*!
 * Popright
 * Copyright (c) 2026 Vincent La
 * Released under the MIT License.
 */
`;

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

async function cleanDist(packageName) {
  const dist = path.join(root, "packages", packageName, "dist");
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  return dist;
}

async function buildCore() {
  const dist = path.join(root, "packages", "core", "dist");
  const src = path.join(root, "packages", "core", "src");
  await copyFile(path.join(src, "styles", "popright.css"), path.join(dist, "styles.css"));
  await copyFile(path.join(src, "styles", "dropdown.css"), path.join(dist, "dropdown.css"));
}

async function buildReact() {
  await mkdir(path.join(root, "packages", "react", "dist"), { recursive: true });
}

async function buildCommonJs() {
  for (const packageName of ["core", "react"]) {
    const packageRoot = path.join(root, "packages", packageName);
    const cjsOut = path.join(packageRoot, "dist-cjs");
    await rm(cjsOut, { recursive: true, force: true });
    await run(process.execPath, [
      tsc,
      "-p",
      path.join(packageRoot, "tsconfig.json"),
      "--module",
      "CommonJS",
      "--moduleResolution",
      "Node",
      "--composite",
      "false",
      "--verbatimModuleSyntax",
      "false",
      "--declaration",
      "false",
      "--declarationMap",
      "false",
      "--outDir",
      cjsOut
    ]);
    await moveCommonJsFiles(packageName, cjsOut);
    await rm(cjsOut, { recursive: true, force: true });
  }
}

async function moveCommonJsFiles(packageName, cjsOut) {
  const dist = path.join(root, "packages", packageName, "dist");
  const entries = await readdir(cjsOut, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }

    const sourceFile = path.join(entry.parentPath, entry.name);
    const relative = path.relative(cjsOut, sourceFile);
    const targetFile = path.join(dist, relative).replace(/\.js$/, ".cjs");
    let source = await readFile(sourceFile, "utf8");
    source = source.replace(/require\((["'])(\.[^"']+)\.js\1\)/g, "require($1$2.cjs$1)");
    await writeFile(targetFile, source);
  }
}

async function addJavaScriptBanners(packageName) {
  const dist = path.join(root, "packages", packageName, "dist");
  const entries = await readdir(dist, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }

    const file = path.join(entry.parentPath, entry.name);
    const source = await readFile(file, "utf8");
    if (!source.startsWith(jsBanner)) {
      await writeFile(file, `${jsBanner}${source}`);
    }
  }
}

await cleanDist("core");
await cleanDist("react");
await run(process.execPath, [tsc, "-b", "--force"]);
await buildCommonJs();
await buildCore();
await buildReact();
await addJavaScriptBanners("core");
await addJavaScriptBanners("react");

const rootPackage = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
console.log(`Built ${rootPackage.name}`);
