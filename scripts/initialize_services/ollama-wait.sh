#!/bin/sh
set -e

OLLAMA_HOST=${OLLAMA_API_HOST:-http://localhost:11434}

echo "⏳ Waiting for Ollama at $OLLAMA_HOST..."
until curl -s $OLLAMA_HOST > /dev/null; do
    echo "Ollama not ready, sleeping 3s..."
    sleep 3
done

echo "✅ Ollama is ready!"
