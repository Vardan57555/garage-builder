#!/bin/bash

COMFYUI_URL="http://localhost:8188/system_stats"
MAX_ATTEMPTS=30
ATTEMPT=0

echo "Waiting for ComfyUI to be healthy..."

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s "$COMFYUI_URL" > /dev/null 2>&1; then
    echo "✅ ComfyUI is healthy!"
    exit 0
  fi

  ATTEMPT=$((ATTEMPT + 1))
  echo "ComfyUI not ready yet... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 2
done

echo "❌ ComfyUI failed to start within timeout"
exit 1
