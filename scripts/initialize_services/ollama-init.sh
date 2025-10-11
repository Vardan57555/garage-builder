#!/bin/sh
set -e

MODEL_NAME="llama3.2:latest"
OLLAMA_HOST="http://localhost:11434"

# 🕒 Wait for Ollama container to be created
echo "⏳ Waiting for Ollama container to exist..."
while [ -z "$(docker ps --filter "name=ollama" --format '{{.Names}}')" ]; do
    echo "⏳ Ollama container not found yet... waiting 3s"
    sleep 3
done

# Now get the container name
OLLAMA_CONTAINER=$(docker ps --filter "name=ollama" --format "{{.Names}}")
echo "✅ Found Ollama container: $OLLAMA_CONTAINER"

# 🚀 Wait for container to be running
echo "🚀 Waiting for Ollama container $OLLAMA_CONTAINER to be running..."
until [ "$(docker inspect -f '{{.State.Running}}' $OLLAMA_CONTAINER)" = "true" ]; do
    echo "⏳ Ollama container not running yet... waiting 3s"
    sleep 3
done
echo "✅ Ollama container is running!"

# 🌐 Wait for API to respond
echo "⏳ Waiting for Ollama API..."
until curl -s "$OLLAMA_HOST" > /dev/null 2>&1; do
    echo "⏳ Ollama not responding yet... waiting 3s"
    sleep 3
done
echo "✅ Ollama API is ready!"

# 🧠 Pull model if not exists
if ! docker exec "$OLLAMA_CONTAINER" sh -c "ollama list | grep -q '$MODEL_NAME'"; then
    echo "📥 Pulling $MODEL_NAME model..."
    docker exec "$OLLAMA_CONTAINER" sh -c "ollama pull $MODEL_NAME"
else
    echo "✅ Model $MODEL_NAME already exists."
fi

echo "✅ Ollama ready with model!"
