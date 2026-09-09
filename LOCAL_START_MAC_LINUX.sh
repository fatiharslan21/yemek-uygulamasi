#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js bulunamadı. Önce Node.js LTS kur."
  exit 1
fi

if [ ! -d node_modules ]; then
  npm install
fi

npm run dev
