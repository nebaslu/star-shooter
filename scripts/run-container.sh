#!/usr/bin/env bash
set -euo pipefail

IMAGE="star-shooter:latest"
CONTAINER="star-shooter"
PORT="${PORT:-8080}"

if command -v podman >/dev/null 2>&1; then
  RUNTIME=podman
elif command -v docker >/dev/null 2>&1; then
  RUNTIME=docker
else
  echo "ERROR: instala podman o docker en tu equipo" >&2
  exit 1
fi

case "${1:-up}" in
  up)
    echo "==> Compilando la imagen con $RUNTIME (sin instalar Node en tu equipo)..."
    "$RUNTIME" build -t "$IMAGE" .
    "$RUNTIME" rm -f "$CONTAINER" >/dev/null 2>&1 || true
    "$RUNTIME" run -d --name "$CONTAINER" -p "$PORT:80" "$IMAGE"
    echo "==> Star Shooter corriendo en http://localhost:$PORT"
    echo "    Para parar y borrar el contenedor: $0 down"
    ;;
  down)
    "$RUNTIME" stop "$CONTAINER" >/dev/null 2>&1 || true
    "$RUNTIME" rm -f "$CONTAINER" >/dev/null 2>&1 || true
    echo "==> Contenedor '$CONTAINER' parado y eliminado"
    ;;
  *)
    echo "Uso: $0 [up|down]   (por defecto: up)" >&2
    exit 1
    ;;
esac
