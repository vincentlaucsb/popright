import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");

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
}

async function buildReact() {
  await mkdir(path.join(root, "packages", "react", "dist"), { recursive: true });
}

await cleanDist("core");
await cleanDist("react");
await run(process.execPath, [tsc, "-b", "--force"]);
await buildCore();
await buildReact();

const rootPackage = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
console.log(`Built ${rootPackage.name}`);
