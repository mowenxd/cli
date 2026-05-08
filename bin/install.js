/**
 * Partial code derived from: lark-cli
 * Repository: https://github.com/larksuite/cli
 *
 * Copyright (c) 2026 Lark Technologies Pte. Ltd.
 *
 * Licensed under the MIT License.
 * See LICENSE file for full license information.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

const VERSION = require("../package.json").version;
const CLI_NAME = "mo-cli";
const REPO = "mo/release/" + CLI_NAME;
const BIN_NAME = "mocli"
const DOWNLOAD_BASE_URL_ENV = "MO_CLI_DOWN_BASE_URL";
const LOG_PREFIX = "[MO-INSTALL]";

// 将 Node.js 运行时的平台标识映射为发布产物命名使用的平台字段。
const PLATFORM_MAP = {
  darwin: "darwin",
  linux: "linux",
  win32: "windows",
};

const ARCH_MAP = {
  x64: "amd64",
  arm64: "arm64",
};

const platform = PLATFORM_MAP[process.platform];
const arch = ARCH_MAP[process.arch];

if (!platform || !arch) {
  console.error(
    `Unsupported platform: ${process.platform}-${process.arch}`
  );
  process.exit(1);
}

const isWindows = process.platform === "win32";
const ext = isWindows ? ".zip" : ".tar.gz";
// 发布包命名规则：
// mo-cli-v{version}-{platform}-{arch}.{ext}
const archiveName = `${CLI_NAME}-v${VERSION}-${platform}-${arch}${ext}`;


const downloadBaseUrl = resolveDownloadBaseUrl();
const BIN_URL = `${downloadBaseUrl}/v${VERSION}/${archiveName}`;

const binDir = path.join(__dirname, "..", "bin");
const dest = path.join(binDir, BIN_NAME + (isWindows ? ".exe" : ""));

fs.mkdirSync(binDir, { recursive: true });

// 解析 base url
function resolveDownloadBaseUrl() {
  const envUrl = process.env[DOWNLOAD_BASE_URL_ENV]?.trim();
  if (!envUrl) {
    return `https://pub-sdn-001.mowen.cn/${REPO}`;
  }

  return envUrl.replace(/\/+$/, "") + "/" + REPO;
}

// 下载
function download(url, destPath) {
  console.log(`${LOG_PREFIX} Downloading: ${url} to ${destPath}`);

  // --ssl-revoke-best-effort: 在 Windows (Schannel) 下，规避证书吊销列表服务不可达时
  // 报出的 CRYPT_E_REVOCATION_OFFLINE 错误
  const sslFlag = isWindows ? "--ssl-revoke-best-effort " : "";
  execSync(
    `curl ${sslFlag}--fail --location --silent --show-error --connect-timeout 10 --max-time 120 --output "${destPath}" "${url}"`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );
}

// 安装
function install() {
  if (process.env[DOWNLOAD_BASE_URL_ENV]?.trim()) {
    console.log(`${LOG_PREFIX} Using custom download base URL from ${DOWNLOAD_BASE_URL_ENV}: ${downloadBaseUrl}`);
  }

  // 使用临时目录承载下载和解压流程。
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mo-cli-"));
  const archivePath = path.join(tmpDir, archiveName);

  try {
    try {
      download(BIN_URL, archivePath);
    } catch (err) {
      throw new Error(
        `Download failed from ${BIN_URL} to ${archivePath}: ${err.message}`
      );
    }

    // 解压
    try {
      console.log(`${LOG_PREFIX} Extracting: ${archivePath} to ${tmpDir}`);
      if (isWindows) {
        execSync(
          `powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${tmpDir}'"`,
          { stdio: "ignore" }
        );
      } else {
        execSync(`tar -xzf "${archivePath}" -C "${tmpDir}"`, {
          stdio: "ignore",
        });
      }
    } catch (err) {
      throw new Error(`Extract failed for ${archivePath}: ${err.message}`);
    }

    // 解压后的可执行文件先是完整发布名，再统一重命名为稳定名称 `mocli`。
    const extractedName = `${CLI_NAME}-v${VERSION}-${platform}-${arch}${isWindows ? ".exe" : ""}`;
    const extractedSource = path.join(tmpDir, extractedName);
    const extractedBinary = path.join(tmpDir, BIN_NAME + (isWindows ? ".exe" : ""));

    // 重命名
    try {
      console.log(`${LOG_PREFIX} Renaming extracted binary ${extractedSource} to ${extractedBinary}`);
      fs.rmSync(extractedBinary, { force: true });
      fs.renameSync(extractedSource, extractedBinary);
    } catch (err) {
      throw new Error(
        `Rename failed from ${extractedSource} to ${extractedBinary}: ${err.message}`
      );
    }

    try {
      console.log(`${LOG_PREFIX} Placing binary ${extractedBinary} to ${dest}`);
      // 拷贝到包内 bin 目录，供 `bin/run.js` 直接执行。
      fs.copyFileSync(extractedBinary, dest);
      fs.chmodSync(dest, 0o755);
    } catch (err) {
      throw new Error(
        `Install failed while placing binary ${extractedBinary} to ${dest}: ${err.message}`
      );
    }

    console.log(`${LOG_PREFIX} ${CLI_NAME} v${VERSION} installed successfully`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

try {
  install();
} catch (err) {
  console.error(`${LOG_PREFIX} Failed to install ${CLI_NAME}:`, err.message); 
  console.error(
    `\nIf you are behind a firewall or in a restricted network, try setting a proxy:\n` +
    `  export https_proxy=http://your-proxy:port\n` +
    `  npm install -g @mowenxd/cli`
  );
  process.exit(1);
}
