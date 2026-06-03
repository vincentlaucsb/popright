import { readFile, writeFile } from "node:fs/promises";

const PACKAGE_PATHS = [
  "packages/core/package.json",
  "packages/react/package.json"
];
const LOCKFILE_PATH = "package-lock.json";
const INTERNAL_PACKAGE_NAMES = new Set(["popright", "@popright/react"]);

const bumpTypes = ["major", "minor", "patch"];
const selectedBumps = bumpTypes.filter((type) => process.argv.includes(`--${type}`));

if (selectedBumps.length !== 1) {
  console.error("Usage: npm run version:bump -- --major|--minor|--patch");
  process.exit(1);
}

const bumpType = selectedBumps[0];

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

  if (!match) {
    throw new Error(`Expected a plain semver version, got ${version}`);
  }

  return match.slice(1).map(Number);
}

function bumpVersion(version, type) {
  const [major, minor, patch] = parseVersion(version);

  if (type === "major") {
    return `${major + 1}.0.0`;
  }

  if (type === "minor") {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function updateInternalDependencyRefs(dependencies, currentVersion, nextVersion) {
  if (!dependencies) {
    return;
  }

  for (const packageName of INTERNAL_PACKAGE_NAMES) {
    if (dependencies[packageName] === currentVersion) {
      dependencies[packageName] = nextVersion;
    }
  }
}

const packageJsons = await Promise.all(PACKAGE_PATHS.map(readJson));
const currentVersion = packageJsons[0].version;

for (const packageJson of packageJsons) {
  if (packageJson.version !== currentVersion) {
    throw new Error(
      `Package versions are out of sync: expected ${currentVersion}, found ${packageJson.version} in ${packageJson.name}`
    );
  }
}

const nextVersion = bumpVersion(currentVersion, bumpType);

for (const [index, packageJson] of packageJsons.entries()) {
  packageJson.version = nextVersion;
  updateInternalDependencyRefs(packageJson.dependencies, currentVersion, nextVersion);
  updateInternalDependencyRefs(packageJson.devDependencies, currentVersion, nextVersion);
  updateInternalDependencyRefs(packageJson.peerDependencies, currentVersion, nextVersion);
  updateInternalDependencyRefs(packageJson.optionalDependencies, currentVersion, nextVersion);

  await writeJson(PACKAGE_PATHS[index], packageJson);
}

const lockfile = await readJson(LOCKFILE_PATH);

for (const packagePath of PACKAGE_PATHS) {
  const lockPackage = lockfile.packages?.[packagePath.replace(/\\/g, "/")];

  if (lockPackage?.version === currentVersion) {
    lockPackage.version = nextVersion;
  }

  updateInternalDependencyRefs(lockPackage?.dependencies, currentVersion, nextVersion);
  updateInternalDependencyRefs(lockPackage?.devDependencies, currentVersion, nextVersion);
  updateInternalDependencyRefs(lockPackage?.peerDependencies, currentVersion, nextVersion);
  updateInternalDependencyRefs(lockPackage?.optionalDependencies, currentVersion, nextVersion);
}

await writeJson(LOCKFILE_PATH, lockfile);

console.log(`Bumped workspace package versions from ${currentVersion} to ${nextVersion}.`);
