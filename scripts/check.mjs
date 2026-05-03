import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const required = [
  "packages/core/src/index.ts",
  "packages/core/src/ContextMenu.ts",
  "packages/core/src/MenuController.ts",
  "packages/core/src/ThemeStore.ts",
  "packages/core/src/types.ts",
  "packages/core/src/styles/popright.scss",
  "packages/core/src/styles/popright.css",
  "packages/react/src/index.ts",
  "examples/vanilla/index.html",
  ".github/workflows/ci.yml"
];

for (const file of required) {
  await access(path.join(root, file));
}

const coreTypes = `${await readFile(path.join(root, "packages/core/src/types.ts"), "utf8")}
${await readFile(path.join(root, "packages/core/src/index.ts"), "utf8")}`;
for (const symbol of ["createContextMenu", "ContextMenuOptions", "MenuItem", "contextMenuTheme"]) {
  if (!coreTypes.includes(symbol)) {
    throw new Error(`Missing public type symbol: ${symbol}`);
  }
}

console.log("Workspace check passed");
