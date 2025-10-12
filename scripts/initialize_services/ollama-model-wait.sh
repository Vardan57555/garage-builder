#!/bin/sh
set -e

MODEL_NAME="llama3.2:latest"
OLLAMA_CONTAINER=$(docker ps --filter "name=ollama" --format "{{.Names}}")

echo "⏳ Waiting for model $MODEL_NAME to be fully pulled..."
until docker exec "$OLLAMA_CONTAINER" sh -c "ollama list | grep -q '$MODEL_NAME'"; do
    echo "   🕒 Model not ready yet... waiting 5s"
    sleep 5
done
echo "✅ Model $MODEL_NAME is ready!"
