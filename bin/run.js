#!/usr/bin/env node

/**
 * Partial code derived from: lark-cli
 * Repository: https://github.com/larksuite/cli
 *
 * Copyright (c) 2026 Lark Technologies Pte. Ltd.
 *
 * Licensed under the MIT License.
 * See LICENSE file for full license information.
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BIN_NAME = "mocli"
const ext = process.platform === "win32" ? ".exe" : "";
const bin = path.join(__dirname, "..", "bin", BIN_NAME + ext);

// On Windows, a crashed self-update may have left the binary renamed to .old.
// Recover it before proceeding so the CLI remains functional.
const oldBin = bin + ".old";
function restoreOldBinary() {
  try {
    if (fs.existsSync(bin)) {
      fs.rmSync(bin, { force: true });
    }
    fs.renameSync(oldBin, bin);
    return true;
  } catch (_) {
    return false;
  }
}

if (process.platform === "win32" && fs.existsSync(oldBin)) {
  if (!fs.existsSync(bin)) {
    restoreOldBinary();
  } else {
    try {
      execFileSync(bin, ["--version"], { stdio: "ignore", timeout: 10000 });
      try {
        fs.rmSync(oldBin, { force: true });
      } catch (_) {
        // Best-effort cleanup; keep running the healthy binary.
      }
    } catch (_) {
      restoreOldBinary();
    }
  }
}

if (!fs.existsSync(bin)) {
  console.error(
    `Error: mocli binary not found at ${bin}\n\n` +
    `This usually means the postinstall script was skipped.\n` +
    `Common causes:\n` +
    `  - npm is configured with ignore-scripts=true\n` +
    `  - The postinstall download failed\n\n` +
    `To fix, run the install script manually:\n` +
    `  node "${path.join(__dirname, "install.js")}"\n`
  );
  process.exit(1);
}

try {
  execFileSync(bin, process.argv.slice(2), { stdio: "inherit" });
} catch (e) {
  process.exit(e.status || 1);
}