#!/bin/bash
set -e

# Configuration
CHECKPOINT_URL="https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
CHECKPOINT_NAME="sd_xl_base_1.0.safetensors"
# Save directly to checkpoints directory (not subdirectory)
CHECKPOINT_DIR="/app/models/checkpoints"

COMFYUI_CONTAINER=$(docker ps --filter "name=comfyui" --format "{{.Names}}")

if [ -z "$COMFYUI_CONTAINER" ]; then
    echo "❌ ComfyUI container not found"
    exit 1
fi

echo "📥 Setting up ComfyUI checkpoint..."

# Check if checkpoint already exists
if docker exec "$COMFYUI_CONTAINER" sh -c "[ -f $CHECKPOINT_DIR/$CHECKPOINT_NAME ]"; then
    echo "✅ Checkpoint $CHECKPOINT_NAME already exists!"
    echo "📊 File location:"
    docker exec "$COMFYUI_CONTAINER" sh -c "ls -lh $CHECKPOINT_DIR/$CHECKPOINT_NAME"
    exit 0
fi

echo "📥 Downloading $CHECKPOINT_NAME..."
echo "⚠️  This may take several minutes (6.5GB)..."
echo "📍 Saving to: $CHECKPOINT_DIR/$CHECKPOINT_NAME"

# Download checkpoint inside the container
if docker exec "$COMFYUI_CONTAINER" sh -c "
    mkdir -p $CHECKPOINT_DIR && \
    cd $CHECKPOINT_DIR && \
    wget --progress=bar:force:noscroll \
    '$CHECKPOINT_URL' \
    -O '$CHECKPOINT_NAME' && \
    echo 'Download complete!' && \
    ls -lh '$CHECKPOINT_NAME'
"; then
    echo "✅ Checkpoint downloaded successfully!"
    echo "📊 Checkpoint details:"
    docker exec "$COMFYUI_CONTAINER" sh -c "ls -lh $CHECKPOINT_DIR/$CHECKPOINT_NAME"

    # Verify file exists and is accessible
    echo "🔍 Verifying checkpoint..."
    docker exec "$COMFYUI_CONTAINER" sh -c "[ -f $CHECKPOINT_DIR/$CHECKPOINT_NAME ] && echo '✅ Checkpoint verified and ready to use' || echo '❌ Checkpoint verification failed'"
else
    echo "❌ Failed to download checkpoint"
    exit 1
fi
