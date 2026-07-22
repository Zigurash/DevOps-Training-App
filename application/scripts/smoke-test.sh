#!/usr/bin/env sh
set -eu

BASE_URL="${1:-http://localhost:8080}"

echo "Smoke testing $BASE_URL"

curl -fsS "$BASE_URL/api/health/live" | grep -q '"status":"ok"'
curl -fsS "$BASE_URL/api/health" | grep -q '"database"'
curl -fsS "$BASE_URL/api/system/info" | grep -q '"hostname"'
curl -fsS "$BASE_URL/" | grep -qi 'html'

echo "Smoke tests passed"
