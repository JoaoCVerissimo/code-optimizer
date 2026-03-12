#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

LANGUAGES=("python" "javascript" "typescript" "go")

for lang in "${LANGUAGES[@]}"; do
  echo "Building sandbox image for ${lang}..."
  docker build \
    -t "optimizer-sandbox-${lang}:latest" \
    -f "${ROOT_DIR}/sandbox-images/${lang}/Dockerfile" \
    "${ROOT_DIR}"
  echo "Built optimizer-sandbox-${lang}:latest"
done

echo "All sandbox images built successfully."
