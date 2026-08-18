#!/usr/bin/env bash
# Rebuild eForm images, recreate containers, keep .env / JWT_SECRET.
# A new image ID (e.g. eform-auth:latest a26f5154c988) is expected.
set -euo pipefail

SKIP_PULL=0
for arg in "$@"; do
  case "$arg" in
    --skip-pull)
      SKIP_PULL=1
      ;;
    -h|--help)
      echo "Usage: $0 [--skip-pull]"
      echo
      echo "Redeploy eForm APIs on this VPS: git pull, rebuild, recreate containers."
      echo "Does not copy .env.example or rotate JWT_SECRET."
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: $0 [--skip-pull]" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

if [[ ! -f docker-compose.yml ]]; then
  echo "error: docker-compose.yml not found in $ROOT" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "error: .env is missing." >&2
  echo "For first-time setup only: copy .env.example to .env and set JWT_SECRET." >&2
  echo "Do not regenerate JWT_SECRET on later deploys." >&2
  exit 1
fi

jwt_secret="$(
  grep -E '^[[:space:]]*JWT_SECRET=' .env \
    | head -n1 \
    | cut -d= -f2- \
    | tr -d '\r' \
    | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/^["'\'']//;s/["'\'']$//'
)"

if [[ -z "$jwt_secret" ]]; then
  echo "error: JWT_SECRET is empty in .env" >&2
  exit 1
fi

if [[ "$jwt_secret" == "replace-with-a-long-random-secret-at-least-32-chars" ]]; then
  echo "error: JWT_SECRET is still the placeholder from .env.example." >&2
  echo "Set a real secret once and keep it. Rotating it invalidates logins." >&2
  exit 1
fi

echo "JWT_SECRET=***present***"

if [[ "$SKIP_PULL" -eq 0 ]]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Pulling latest code..."
    git pull
  else
    echo "warning: not a git repository; skipping git pull" >&2
  fi
else
  echo "Skipping git pull (--skip-pull)"
fi

echo "Building and recreating containers..."
docker compose up -d --build --force-recreate --remove-orphans

if docker ps --format '{{.Names}}' | grep -qx 'duton-nginx'; then
  echo "Connecting duton-nginx to eform_eform (ignore if already connected)..."
  docker network connect eform_eform duton-nginx 2>/dev/null || true
fi

echo "Pruning dangling images..."
docker image prune -f

echo
echo "=== compose ps ==="
docker compose ps

echo
echo "=== nginx / ==="
curl -sS http://127.0.0.1/ || true
echo

echo
echo "=== auth health ==="
docker compose exec -T auth wget -qO- http://127.0.0.1:8080/actuator/health || true
echo

echo
echo "Redeploy finished. A new image ID for eform-auth:latest is expected."
echo "If login still fails, check: docker compose logs auth"
echo "Users with tokens from a changed JWT_SECRET must log in again."
