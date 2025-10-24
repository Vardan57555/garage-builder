#!/bin/bash

echo "🎨 Starting Image Generation Service (Demo Mode)"
echo ""
echo "This demo version generates placeholder images for testing."
echo "No GPU or ComfyUI required!"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install minimal dependencies
echo "📥 Installing dependencies..."
pip install -q fastapi uvicorn pillow python-multipart aiofiles

# Create directories
mkdir -p outputs static

# Copy static files if they exist
if [ -f "static/index.html" ]; then
    echo "✅ Static files ready"
else
    echo "⚠️  No static/index.html found (optional)"
fi

echo ""
echo "🚀 Starting demo service on http://localhost:5001"
echo ""
echo "Test it with:"
echo "  curl -X POST http://localhost:5001/generate-image \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"width\":20,\"length\":24,\"height\":10,\"roof_type\":\"gable\",\"color\":\"white\",\"building_type\":\"garage\"}'"
echo ""

# Run the demo app
python app_demo.py
