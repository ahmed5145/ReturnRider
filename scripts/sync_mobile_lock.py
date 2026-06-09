#!/usr/bin/env python3
"""Update apps/mobile/package-lock.json for react-native-plaid-link-sdk."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOBILE = ROOT / "apps" / "mobile"
LOCK = MOBILE / "package-lock.json"
PACKAGE = "react-native-plaid-link-sdk"


def npm_metadata(version: str) -> dict:
    url = f"https://registry.npmjs.org/{PACKAGE}/{version}"
    with urllib.request.urlopen(url, timeout=60) as response:
        return json.load(response)


def patch_lock(version: str, integrity: str, tarball: str) -> None:
    data = json.loads(LOCK.read_text(encoding="utf-8"))
    data["packages"][""]["dependencies"][PACKAGE] = version
    data["packages"][f"node_modules/{PACKAGE}"] = {
        "version": version,
        "resolved": tarball,
        "integrity": integrity,
        "license": "MIT",
        "peerDependencies": {
            "react": "*",
            "react-native": "*",
        },
    }
    LOCK.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def find_npm() -> str | None:
    if os.name == "nt":
        return shutil.which("npm.cmd") or shutil.which("npm")
    return shutil.which("npm")


def main() -> int:
    pkg = json.loads((MOBILE / "package.json").read_text(encoding="utf-8"))
    version = pkg["dependencies"][PACKAGE].lstrip("^")
    print(f"Fetching npm metadata for {PACKAGE}@{version} …")
    meta = npm_metadata(version)
    integrity = meta["dist"]["integrity"]
    tarball = meta["dist"]["tarball"]
    patch_lock(version, integrity, tarball)
    print(f"Patched {LOCK.relative_to(ROOT)}")

    npm = find_npm()
    if not npm:
        print("npm not in PATH — patch saved. Verify manually:")
        print("  cd apps\\mobile && npm ci")
        print("OK — commit apps/mobile/package-lock.json")
        return 0

    print("Verifying with npm ci …")
    result = subprocess.run(
        [npm, "ci", "--no-audit", "--no-fund"],
        cwd=MOBILE,
        check=False,
    )
    if result.returncode != 0:
        print("npm ci failed after patch", file=sys.stderr)
        return result.returncode

    print("OK — commit apps/mobile/package-lock.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
