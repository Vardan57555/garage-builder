#!/bin/bash

MODEL_DIR="/app/ComfyUI/models/checkpoints"
MODEL_FILE="$MODEL_DIR/sd_xl_base_1.0.safetensors"
MODEL_URL="https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"

echo "🔍 Checking for SDXL model..."

if [ -f "$MODEL_FILE" ]; then
    echo "✅ Model already exists at $MODEL_FILE"
    echo "📊 Model size: $(du -h $MODEL_FILE | cut -f1)"
else
    echo "📥 Model not found. Downloading SDXL model (~7GB)..."
    echo "⏳ This will take 5-10 minutes depending on your connection..."
    
    mkdir -p "$MODEL_DIR"
    
    # Download with progress
    wget --progress=bar:force:noscroll \
         -O "$MODEL_FILE" \
         "$MODEL_URL"
    
    if [ $? -eq 0 ]; then
        echo "✅ Model downloaded successfully!"
        echo "📊 Model size: $(du -h $MODEL_FILE | cut -f1)"
    else
        echo "❌ Model download failed!"
        exit 1
    fi
fi

echo "🚀 Model ready!"
