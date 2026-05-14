/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const { homedir, platform } = require("node:os");
const { join } = require("node:path");

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const platforms = {
    darwin: [
      join(homedir(), "Library/Caches/ms-playwright"),
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    ],
    linux: [
      join(homedir(), ".cache/ms-playwright"),
      "/usr/bin/google-chrome",
      "/usr/bin/chromium",
    ],
  };

  const platformName = platform();
  const platformPaths = platforms[platformName] || [];

  for (const p of platformPaths) {
    if (existsSync(p)) {
      if (p.includes("ms-playwright")) {
        try {
          const findCmd = platformName === "darwin" 
            ? `find "${p}" -name "Google Chrome for Testing" -type f | sort -V | tail -n 1`
            : `find "${p}" -name "chrome" -type f | sort -V | tail -n 1`;
          const found = execSync(findCmd).toString().trim();
          if (found && existsSync(found)) return found;
        } catch {
          // ignore
        }
      } else {
        return p;
      }
    }
  }

  return undefined;
}

module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run preview -- --port 4173 --strictPort",
      startServerReadyPattern: "http://localhost:4173",
      startServerReadyTimeout: 300000,
      numberOfRuns: 3,
      url: ["http://localhost:4173/"],
      chromePath: (() => {
        const path = findChrome();
        // eslint-disable-next-line no-console
        console.log(`LHCI: Using Chrome at ${path}`);
        return path;
      })(),
      chromeFlags: "--no-sandbox --headless=new --disable-gpu --ignore-certificate-errors --disable-dev-shm-usage --disable-setuid-sandbox --disable-software-rasterizer",
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:performance": ["warn", { minScore: 0.5 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "legacy-javascript": "off",
        "unused-javascript": "warn",
        "render-blocking-resources": "warn",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
