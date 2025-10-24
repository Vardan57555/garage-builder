#!/bin/bash

# Garage Image Generation Service Startup Script

echo "🚀 Starting Garage Image Generation Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Check if ComfyUI is accessible
COMFYUI_URL=${COMFYUI_URL:-"http://localhost:8188"}
echo "🔍 Checking ComfyUI at $COMFYUI_URL..."

if curl -s "$COMFYUI_URL/system_stats" > /dev/null 2>&1; then
    echo "✅ ComfyUI is accessible"
else
    echo "⚠️  Warning: ComfyUI is not accessible at $COMFYUI_URL"
    echo "   Make sure ComfyUI is running before generating images"
fi

# Create outputs directory
mkdir -p outputs

# Start the service
echo "🎨 Starting image generation service on port ${PORT:-5001}..."
python app.py
