import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const demoRoot = path.join(root, "dist-demo");
const port = Number(process.env.PORT ?? 4173);
const coreDist = path.join(root, "packages", "core", "dist");
let activeRefresh;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

const coreInputs = [
  path.join(root, "packages", "core", "src"),
  path.join(root, "packages", "core", "package.json"),
  path.join(root, "packages", "core", "tsconfig.json"),
  path.join(root, "scripts", "build.mjs")
];

const demoInputs = [
  path.join(root, "examples", "vanilla", "index.html"),
  path.join(root, "examples", "vanilla", "demo.js"),
  path.join(root, "scripts", "build-demo.mjs")
];

async function getFileMtime(filePath) {
  try {
    return (await stat(filePath)).mtimeMs;
  } catch {
    return undefined;
  }
}

async function getNewestMtime(filePath) {
  let info;
  try {
    info = await stat(filePath);
  } catch {
    return undefined;
  }

  if (!info.isDirectory()) {
    return info.mtimeMs;
  }

  const entries = await readdir(filePath, { withFileTypes: true });
  const mtimes = await Promise.all(
    entries.map((entry) => getNewestMtime(path.join(filePath, entry.name)))
  );
  return Math.max(info.mtimeMs, ...mtimes.filter((mtime) => mtime !== undefined));
}

async function getNewestInputMtime(paths) {
  const mtimes = await Promise.all(paths.map((filePath) => getNewestMtime(filePath)));
  const existing = mtimes.filter((mtime) => mtime !== undefined);
  return existing.length === 0 ? undefined : Math.max(...existing);
}

async function isOutputStale(inputs, output) {
  const [inputMtime, outputMtime] = await Promise.all([
    getNewestInputMtime(inputs),
    getFileMtime(output)
  ]);
  return outputMtime === undefined || (inputMtime !== undefined && inputMtime > outputMtime);
}

async function isAnyOutputStale(pairs) {
  const results = await Promise.all(pairs.map(({ inputs, output }) => isOutputStale(inputs, output)));
  return results.some(Boolean);
}

function isCoreBuildStale() {
  return isAnyOutputStale([
    { inputs: coreInputs, output: path.join(coreDist, "index.js") },
    {
      inputs: [path.join(root, "packages", "core", "src", "styles", "popright.css")],
      output: path.join(coreDist, "styles.css")
    },
    {
      inputs: [path.join(root, "packages", "core", "src", "styles", "dropdown.css")],
      output: path.join(coreDist, "dropdown.css")
    }
  ]);
}

function isDemoBuildStale() {
  return isAnyOutputStale([
    { inputs: demoInputs, output: path.join(demoRoot, "index.html") },
    { inputs: demoInputs, output: path.join(demoRoot, "demo.js") },
    {
      inputs: [path.join(coreDist, "index.js")],
      output: path.join(demoRoot, "assets", "core", "index.js")
    },
    {
      inputs: [path.join(coreDist, "styles.css")],
      output: path.join(demoRoot, "assets", "core", "popright.css")
    }
  ]);
}

function runScript(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "scripts", script)], {
      cwd: root,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} exited with ${code}`));
      }
    });
  });
}

async function refreshDemo() {
  if (activeRefresh) {
    return activeRefresh;
  }

  activeRefresh = (async () => {
    let builtCore = false;
    if (await isCoreBuildStale()) {
      console.log("Core build is stale; rebuilding...");
      await runScript("build.mjs");
      builtCore = true;
    }

    if (builtCore || (await isDemoBuildStale())) {
      console.log("Demo build is stale; rebuilding...");
      await runScript("build-demo.mjs");
    }
  })();

  try {
    await activeRefresh;
  } finally {
    activeRefresh = undefined;
  }
}

const server = createServer(async (request, response) => {
  try {
    await refreshDemo();
    const url = new URL(request.url ?? "/", `http://localhost:${port}`);
    const pathname = decodeURIComponent(url.pathname);
    const requested = pathname === "/" ? "/index.html" : pathname;
    const filePath = path.resolve(demoRoot, `.${requested}`);

    if (!filePath.startsWith(demoRoot)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    const info = await stat(filePath);
    if (!info.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] ?? "application/octet-stream"
    });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await refreshDemo();

server.listen(port, () => {
  console.log(`Popright demo: http://localhost:${port}`);
});
