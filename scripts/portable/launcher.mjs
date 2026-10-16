import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(appDir, "data");
mkdirSync(dataDir, { recursive: true });

const port = String(process.env.GRM_PORT || process.env.PORT || "3000");
const baseUrl = `http://127.0.0.1:${port}`;

function readOrCreateSecret(filePath) {
  try {
    const existing = readFileSync(filePath, "utf8").trim();
    if (existing.length >= 32) return existing;
  } catch {
    // Fall through and generate a new secret.
  }
  const secret = randomBytes(48).toString("hex");
  writeFileSync(filePath, `${secret}\n`, { mode: 0o600 });
  return secret;
}

const env = {
  ...process.env,
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  PORT: port,
  HOSTNAME: "127.0.0.1",
  HTTPS: "false",
  BETTER_AUTH_URL: baseUrl,
};
env.BETTER_AUTH_SECRET = readOrCreateSecret(join(dataDir, ".auth-secret"));

const setupLockPath = join(dataDir, "auth-setup.lock");
let setupToken = null;
if (!existsSync(setupLockPath)) {
  setupToken =
    process.env.AUTH_SETUP_TOKEN?.trim() || randomBytes(24).toString("hex");
  env.AUTH_SETUP_TOKEN = setupToken;
}

console.log("");
console.log("  GitHub Release Monitor (portable)");
console.log(`  Address:  ${baseUrl}`);
if (setupToken) {
  console.log("  First run: initial setup required.");
  console.log("  Setup token (also saved to data\\setup-token.txt):");
  console.log(`    ${setupToken}`);
  writeFileSync(join(dataDir, "setup-token.txt"), `${setupToken}\n`, {
    mode: 0o600,
  });
} else {
  console.log("  Sign in with your existing account.");
}
console.log("");

const server = spawn(process.execPath, [join(appDir, "server.js")], {
  cwd: appDir,
  env,
  stdio: "inherit",
});

server.on("error", (error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

if (!process.env.GRM_NO_BROWSER) {
  setTimeout(() => {
    const opener = spawn("cmd", ["/c", "start", '""', baseUrl], {
      detached: true,
      stdio: "ignore",
    });
    opener.unref();
  }, 2500);
}

server.on("exit", (code) => {
  process.exit(code ?? 0);
});
