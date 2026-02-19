#!/usr/bin/env bash
set -euo pipefail

# Ensure the server is running and ready to accept requests
echo "[ready-cmd] Waiting for the web server to be ready..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000 | grep -q "200"

echo "[ready-cmd] Web server is ready."

# Ensure mobile app is ready
echo "[ready-cmd] Waiting for the mobile app to be ready..."

curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/index.web.tsx.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=src%2Fapp&unstable_transformProfile=hermes-stable" | grep -q "200" &
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/index.tsx.bundle?platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=src%2Fapp&unstable_transformProfile=hermes-stable" | grep -q "200" &
wait

echo "[ready-cmd] Mobile app is ready."
