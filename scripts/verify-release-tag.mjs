import { readFile } from "node:fs/promises";

const packagePaths = [
  "packages/core/package.json",
  "packages/react/package.json"
];

const refName = process.env.GITHUB_REF_NAME;

if (!refName) {
  console.error("GITHUB_REF_NAME is required.");
  process.exit(1);
}

const match = /^(\d+\.\d+\.\d+)$/.exec(refName);

if (!match) {
  console.error(`Release tag must look like 1.2.3, got ${refName}.`);
  process.exit(1);
}

const releaseVersion = match[1];
const packages = await Promise.all(
  packagePaths.map(async (path) => ({
    path,
    json: JSON.parse(await readFile(path, "utf8"))
  }))
);

for (const { path, json } of packages) {
  if (json.version !== releaseVersion) {
    console.error(
      `${path} has version ${json.version}, but release tag ${refName} expects ${releaseVersion}.`
    );
    process.exit(1);
  }
}

const reactPackage = packages.find(({ json }) => json.name === "@popright/react")?.json;

if (reactPackage?.dependencies?.popright !== releaseVersion) {
  console.error(
    `@popright/react depends on popright ${reactPackage?.dependencies?.popright}, but release tag ${refName} expects ${releaseVersion}.`
  );
  process.exit(1);
}

console.log(`Release tag ${refName} matches workspace package versions.`);
