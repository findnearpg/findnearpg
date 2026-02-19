#!/usr/bin/env bash
set -euo pipefail

echo "[vector-wait] Waiting for /home/user/apps/web/.env..."

# Wait until the file exists and is non-empty
while [ ! -s /home/user/apps/web/.env ]; do
  sleep 1
done

# Load key=value pairs from .env
set -a
source /home/user/apps/web/.env
set +a

echo "[vector-wait] Secrets loaded. Starting Vector..."
exec /usr/bin/vector --config /etc/vector/vector.toml
