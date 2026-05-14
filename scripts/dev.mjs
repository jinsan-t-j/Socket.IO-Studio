import { spawn } from "node:child_process";

const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

const server = spawn(npm, ["run", "dev:server"], {
  stdio: "inherit",
});

const client = spawn(npm, ["run", "dev:client"], {
  stdio: "inherit",
});

function shutdown(code = 0) {
  server.kill("SIGTERM");
  client.kill("SIGTERM");
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

server.on("exit", (code) => {
  if (typeof code === "number" && code !== 0) shutdown(code);
});

client.on("exit", (code) => {
  if (typeof code === "number" && code !== 0) shutdown(code);
});
