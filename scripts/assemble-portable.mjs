import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function parseArgs(argv) {
  const args = { out: "dist-portable", nodeDir: null };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--out") args.out = argv[++i];
    else if (flag === "--node-dir") args.nodeDir = argv[++i];
    else throw new Error(`Unknown argument: ${flag}`);
  }
  if (!args.nodeDir) {
    throw new Error("Missing required argument: --node-dir <node runtime dir>");
  }
  return args;
}

function fail(message) {
  console.error(`[assemble] ERROR: ${message}`);
  process.exit(1);
}

function hasNativeBinary(dir) {
  if (!existsSync(dir)) return false;
  const entries = readdirSync(dir, { recursive: true, withFileTypes: true });
  return entries.some(
    (entry) => entry.isFile() && entry.name.endsWith(".node"),
  );
}

function copyPackageWithDeps(packageName, destNodeModules, root) {
  const visited = new Set();
  const queue = [packageName];
  while (queue.length > 0) {
    const name = queue.shift();
    if (visited.has(name)) continue;
    visited.add(name);
    const src = path.join(root, "node_modules", name);
    if (!existsSync(src)) {
      fail(`node_modules/${name} not found (required native dependency)`);
    }
    const dest = path.join(destNodeModules, name);
    cpSync(src, dest, { recursive: true });
    const manifest = JSON.parse(
      readFileSync(path.join(src, "package.json"), "utf8"),
    );
    for (const dep of Object.keys(manifest.dependencies ?? {})) {
      queue.push(dep);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const standaloneDir = path.join(projectRoot, ".next", "standalone");
  const staticDir = path.join(projectRoot, ".next", "static");
  const publicDir = path.join(projectRoot, "public");
  const nodeRuntimeDir = path.resolve(projectRoot, args.nodeDir);
  const outRoot = path.resolve(projectRoot, args.out);
  const pkgName = "GitHubReleaseMonitor";
  const pkgDir = path.join(outRoot, pkgName);
  const appDir = path.join(pkgDir, "app");

  if (!existsSync(path.join(standaloneDir, "server.js"))) {
    fail(".next/standalone/server.js not found - run `npm run build` first");
  }
  if (!existsSync(path.join(nodeRuntimeDir, "node.exe"))) {
    fail(`node.exe not found in node runtime dir: ${nodeRuntimeDir}`);
  }

  rmSync(outRoot, { recursive: true, force: true });
  mkdirSync(appDir, { recursive: true });

  console.log("[assemble] copying standalone output");
  cpSync(standaloneDir, appDir, { recursive: true });

  console.log("[assemble] copying .next/static");
  cpSync(staticDir, path.join(appDir, ".next", "static"), { recursive: true });

  console.log("[assemble] copying public");
  cpSync(publicDir, path.join(appDir, "public"), { recursive: true });

  const cliPath = path.join(projectRoot, ".next", "cli", "grm-cli.mjs");
  if (existsSync(cliPath)) {
    console.log("[assemble] copying grm-cli.mjs");
    cpSync(cliPath, path.join(appDir, "grm-cli.mjs"));
  }

  console.log("[assemble] ensuring native module better-sqlite3");
  const appNodeModules = path.join(appDir, "node_modules");
  const sqliteDest = path.join(appNodeModules, "better-sqlite3");
  if (!hasNativeBinary(sqliteDest)) {
    copyPackageWithDeps("better-sqlite3", appNodeModules, projectRoot);
    if (!hasNativeBinary(sqliteDest)) {
      fail("better-sqlite3 copied but no .node binary found");
    }
  }

  console.log("[assemble] copying portable launcher files");
  const portableDir = path.join(projectRoot, "scripts", "portable");
  const launcherSrc = path.join(portableDir, "launcher.mjs");
  cpSync(launcherSrc, path.join(appDir, "launcher.mjs"));
  const batSrc = path.join(portableDir, "启动监控.bat");
  cpSync(batSrc, path.join(pkgDir, "启动监控.bat"));
  const readmePath = path.join(portableDir, "说明.txt");
  if (existsSync(readmePath)) {
    cpSync(readmePath, path.join(pkgDir, "说明.txt"));
  }

  console.log("[assemble] copying node runtime");
  cpSync(nodeRuntimeDir, path.join(pkgDir, "node"), { recursive: true });

  const serverJs = path.join(appDir, "server.js");
  const nodeExe = path.join(pkgDir, "node", "node.exe");
  if (!existsSync(serverJs)) fail("server.js missing in assembled package");
  if (!existsSync(nodeExe)) fail("node.exe missing in assembled package");

  console.log(`[assemble] OK -> ${pkgDir}`);
}

main();
