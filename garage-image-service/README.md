# Garage Image Generation Service

AI-powered image generation service for creating photorealistic visualizations of garages, sheds, and other metal buildings.

> **📚 Complete Documentation**: See [`/documentation/`](../documentation/) for full documentation including setup guides, architecture, and API reference.

## Features

- 🎨 **Photorealistic Image Generation** - Create high-quality visualizations using Stable Diffusion XL
- 🏗️ **Multiple Building Types** - Support for garages, sheds, carports, and barns
- ⚡ **GPU Accelerated** - Fast generation using NVIDIA GPUs
- 🔧 **Customizable Parameters** - Control dimensions, colors, styles, and features
- 📦 **REST API** - Easy integration with existing applications
- 💾 **Automatic Storage** - Images and metadata saved automatically

## Quick Start

### Using Makefile (Recommended)

From the project root:

```bash
# Build and start the service
make image-gen-build
make image-gen-start

# Check service health
make image-gen-health

# View logs
make image-gen-logs
```

### Using Docker Compose

From this directory:

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Access the Service

- **Streamlit UI**: http://localhost:8501 (Navigate to "Image Generator" page)
- **Web Interface**: http://localhost:5001
- **API Endpoint**: http://localhost:5001/generate-image

### Test the Service

```bash
# From project root
make image-gen-test

# Or directly
python test_service.py
```

## Usage Examples

### Generate a Garage

```bash
curl -X POST http://localhost:5001/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "width": 20,
    "length": 24,
    "height": 10,
    "roof_type": "gable",
    "color": "white",
    "building_type": "garage",
    "style": "modern",
    "lighting": "daylight"
  }'
```

### Generate a Shed

```bash
curl -X POST http://localhost:5001/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "width": 12,
    "length": 16,
    "height": 8,
    "roof_type": "gable",
    "color": "natural wood",
    "building_type": "shed",
    "style": "rustic",
    "lighting": "daylight",
    "additional_features": ["double doors", "windows"]
  }'
```

### List Generated Images

```bash
curl http://localhost:5001/outputs
```

### Python Example

```python
import requests

# Generate image
response = requests.post('http://localhost:5001/generate-image', json={
    "width": 20,
    "length": 20,
    "height": 10,
    "roof_type": "gable",
    "color": "gray",
    "building_type": "garage",
    "style": "modern",
    "lighting": "daylight",
    "preview": True  # Faster generation for testing
})

result = response.json()
print(f"Image URL: {result['file_url']}")
print(f"Generation time: {result['generation_time']}s")
```

## API Reference

### POST /generate-image

Generate a building image.

**Request Body:**
```json
{
  "width": 20,
  "length": 24,
  "height": 10,
  "roof_type": "gable",
  "color": "white",
  "building_type": "garage",
  "location": "suburban area",
  "style": "modern",
  "lighting": "daylight",
  "additional_features": ["windows", "side door"],
  "preview": false
}
```

**Parameters:**
- `width` (float): Building width in feet
- `length` (float): Building length in feet
- `height` (float): Building height in feet
- `roof_type` (string): Roof style (gable, hip, gambrel, flat, a-frame, shed, mansard)
- `color` (string): Primary color
- `building_type` (string): Type of building (garage, shed, carport, barn)
- `location` (string): Setting description
- `style` (string): Architectural style (modern, rustic, industrial, traditional, luxury)
- `lighting` (string): Lighting condition (daylight, sunset, overcast, morning, afternoon, dusk)
- `additional_features` (array): List of additional features
- `preview` (boolean): Generate smaller preview (512x512) for faster results

**Response:**
```json
{
  "status": "success",
  "file_path": "/outputs/garage_20251024_153245.png",
  "file_url": "/outputs/garage_20251024_153245.png",
  "prompt_used": "A modern white garage...",
  "generation_time": 15.3,
  "image_size": {"width": 1024, "height": 768}
}
```

### GET /outputs

List all generated images.

**Query Parameters:**
- `limit` (int): Maximum number of files to return (default: 50)

**Response:**
```json
{
  "files": [
    {
      "filename": "garage_20251024_153245.png",
      "size": 2048576,
      "size_mb": 1.95,
      "created": "2025-10-24T15:32:45",
      "url": "/outputs/garage_20251024_153245.png",
      "metadata": {...}
    }
  ],
  "total": 10
}
```

### GET /outputs/{filename}

Retrieve a specific image.

**Response:** Image file (PNG)

### DELETE /outputs/{filename}

Delete an image and its metadata.

**Response:**
```json
{
  "status": "success",
  "message": "Deleted garage_20251024_153245.png"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "image-generation",
  "comfyui": "healthy",
  "timestamp": "2025-10-24T15:32:45"
}
```

## Configuration

### Environment Variables

- `COMFYUI_URL` - ComfyUI API URL (default: `http://localhost:8188`)
- `PORT` - Service port (default: `5001`)

### Example

```bash
export COMFYUI_URL=http://192.168.1.100:8188
export PORT=5001
python app.py
```

## Project Structure

```
garage-image-service/
├── app.py                      # FastAPI application
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── test_service.py            # Test script
├── services/
│   ├── prompt_builder.py      # Prompt composition
│   ├── image_generator.py     # ComfyUI interface
│   └── storage.py             # File management
├── outputs/                    # Generated images
└── config/                     # Configuration files
```

## Integration with Main Application

### Docker Compose

Add to your `docker-compose.yml`:

```yaml
image-generator:
  build: ./garage-image-service
  container_name: image-generator
  runtime: nvidia
  environment:
    - NVIDIA_VISIBLE_DEVICES=all
    - COMFYUI_URL=http://comfyui:8188
  networks:
    - garage-network
  ports:
    - "5001:5001"
  volumes:
    - ./outputs:/app/outputs
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

### Backend Integration

```typescript
// Node.js/TypeScript example
async function generateBuildingImage(params: BuildingParams): Promise<string> {
  const response = await fetch('http://image-generator:5001/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  const result = await response.json();
  return result.file_url;
}
```

## Performance Tips

1. **Use Preview Mode** for testing - generates 512x512 images much faster
2. **Batch Requests** - Queue multiple generations if needed
3. **Cache Results** - Store generated images to avoid regeneration
4. **Monitor GPU** - Use `nvidia-smi` to check GPU utilization

## Troubleshooting

### Service Won't Start

```bash
# Check if port is in use
lsof -i :5001

# Check Python version
python --version  # Should be 3.10+
```

### ComfyUI Connection Failed

```bash
# Verify ComfyUI is running
curl http://localhost:8188/system_stats

# Check ComfyUI logs
cd /path/to/ComfyUI
tail -f logs/comfyui.log
```

### GPU Not Detected

```bash
# Verify NVIDIA driver
nvidia-smi

# Check CUDA
nvcc --version
```

### Slow Generation

- Reduce image resolution (use `preview: true`)
- Check GPU memory: `nvidia-smi`
- Reduce sampling steps (modify in `image_generator.py`)

## Development

### Running Tests

```bash
# Run all tests
python test_service.py

# Test specific endpoint
curl http://localhost:5001/health
```

### Adding New Building Types

1. Add building type to `prompt_builder.py`
2. Create specialized prompt method
3. Update API documentation

### Custom Prompts

Edit `services/prompt_builder.py` to customize prompt templates:

```python
def build_custom_prompt(self, ...):
    # Your custom prompt logic
    pass
```

## License

[Your License Here]

## Support

For issues and questions:
- GitHub Issues: [Your Repo]
- Documentation: `/documentation/07-image-generation-service.md`
