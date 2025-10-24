# Docker Setup Guide - Image Generation Service

Complete guide to run the Garage Image Generation Service with ComfyUI in Docker.

## Prerequisites

1. **NVIDIA GPU** with ≥12GB VRAM (RTX 3060 or better)
2. **NVIDIA Driver** installed (version 525.60.13 or later)
3. **Docker** with NVIDIA Container Toolkit
4. **Docker Compose** v2.0+

## Quick Start

### 1. Verify GPU Setup

```bash
# Check NVIDIA driver
nvidia-smi

# Test Docker GPU access
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### 2. Build and Start the Service

```bash
# Navigate to the service directory
cd garage-image-service

# Build and start with docker-compose
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### 3. Access the Web Interface

Open your browser and navigate to:
```
http://localhost:5001
```

You should see the Garage Image Generator web interface.

### 4. Generate Your First Image

1. Fill in the building parameters (width, length, height, etc.)
2. Click "Generate Image"
3. Wait 15-30 seconds for the image to be generated
4. View and download your generated image

## Architecture

The Docker container runs two services:

1. **ComfyUI** (Port 8188) - AI image generation backend
2. **FastAPI Service** (Port 5001) - REST API and web interface

Both services are managed by Supervisor and share the same GPU.

## Directory Structure

```
garage-image-service/
├── Dockerfile.complete       # Complete Docker image with ComfyUI
├── docker-compose.yml        # Docker Compose configuration
├── supervisord.conf          # Supervisor configuration
├── app.py                    # FastAPI application
├── requirements.txt          # Python dependencies
├── static/
│   └── index.html           # Web interface
├── services/
│   ├── prompt_builder.py    # Prompt generation
│   ├── image_generator.py   # ComfyUI interface
│   └── storage.py           # File management
└── outputs/                 # Generated images (mounted volume)
```

## Docker Compose Configuration

The `docker-compose.yml` includes:

- **GPU Access**: NVIDIA runtime with GPU reservation
- **Port Mapping**: 5001 (API) and 8188 (ComfyUI)
- **Volume Mounts**: 
  - `./outputs` - Generated images (persistent)
  - `comfyui-models` - Model weights (persistent)
- **Memory Limit**: 16GB
- **Health Check**: Automatic service monitoring

## Building the Image

### Option 1: Using Docker Compose (Recommended)

```bash
docker-compose up -d --build
```

### Option 2: Manual Docker Build

```bash
# Build the image
docker build -f Dockerfile.complete -t garage-image-generator .

# Run the container
docker run -d \
  --name garage-image-generator \
  --gpus all \
  -p 5001:5001 \
  -p 8188:8188 \
  -v $(pwd)/outputs:/app/service/outputs \
  garage-image-generator
```

## Configuration

### Environment Variables

You can customize the service using environment variables in `docker-compose.yml`:

```yaml
environment:
  - NVIDIA_VISIBLE_DEVICES=all
  - COMFYUI_URL=http://localhost:8188
  - PORT=5001
```

### Memory and GPU Limits

Adjust resources in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 16g  # Adjust based on your system
    reservations:
      devices:
        - driver: nvidia
          count: 1  # Number of GPUs
          capabilities: [gpu]
```

## Usage

### Web Interface

1. **Open Browser**: Navigate to `http://localhost:5001`
2. **Fill Form**: Enter building parameters
3. **Generate**: Click "Generate Image" button
4. **View Results**: See generated image and metadata
5. **Gallery**: Browse previously generated images

### API Usage

#### Generate Image

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

#### List Generated Images

```bash
curl http://localhost:5001/outputs
```

#### Health Check

```bash
curl http://localhost:5001/health
```

## Monitoring

### View Logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker logs -f garage-image-generator

# Inside container logs
docker exec garage-image-generator tail -f /var/log/supervisor/image-service.out.log
docker exec garage-image-generator tail -f /var/log/supervisor/comfyui.out.log
```

### Check Service Status

```bash
# Container status
docker-compose ps

# Health check
curl http://localhost:5001/health

# GPU usage
docker exec garage-image-generator nvidia-smi
```

### Access Container Shell

```bash
docker exec -it garage-image-generator bash
```

## Troubleshooting

### Container Won't Start

**Check GPU access:**
```bash
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

**Check logs:**
```bash
docker-compose logs
```

**Verify NVIDIA runtime:**
```bash
docker info | grep -i runtime
```

### ComfyUI Not Starting

**Check ComfyUI logs:**
```bash
docker exec garage-image-generator cat /var/log/supervisor/comfyui.err.log
```

**Verify model download:**
```bash
docker exec garage-image-generator ls -lh /app/ComfyUI/models/checkpoints/
```

### Image Generation Fails

**Check service logs:**
```bash
docker exec garage-image-generator cat /var/log/supervisor/image-service.err.log
```

**Test ComfyUI directly:**
```bash
curl http://localhost:8188/system_stats
```

**Check GPU memory:**
```bash
docker exec garage-image-generator nvidia-smi
```

### Out of Memory

**Reduce memory usage:**
1. Use preview mode (`"preview": true`)
2. Reduce image resolution
3. Increase Docker memory limit
4. Close other GPU applications

### Slow Generation

**Optimization tips:**
1. Use preview mode for testing
2. Check GPU utilization: `nvidia-smi`
3. Ensure no other processes using GPU
4. Verify CUDA is working properly

## Maintenance

### Update Models

```bash
# Download new models
docker exec garage-image-generator bash -c "cd /app/ComfyUI/models/checkpoints && wget <model-url>"

# Restart service
docker-compose restart
```

### Clean Up Old Images

```bash
# Remove old generated images (older than 30 days)
find ./outputs -name "*.png" -mtime +30 -delete
```

### Backup Generated Images

```bash
# Create backup
tar -czf outputs-backup-$(date +%Y%m%d).tar.gz outputs/

# Restore backup
tar -xzf outputs-backup-20251024.tar.gz
```

### Update Service

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Performance Benchmarks

Expected generation times (RTX 3090, 1024x768):

- **Preview (512x512)**: 5-8 seconds
- **Standard (1024x768)**: 15-25 seconds
- **High-res (1536x1024)**: 30-45 seconds

## Security Considerations

1. **Network Access**: Service is exposed on all interfaces (0.0.0.0)
2. **API Authentication**: Not implemented (add if needed)
3. **File Access**: Generated images are publicly accessible
4. **Resource Limits**: Memory and GPU limits are enforced

For production deployment:
- Add authentication middleware
- Use reverse proxy (nginx)
- Implement rate limiting
- Add HTTPS/TLS

## Integration with Main Application

### Add to Main Docker Compose

```yaml
# In your main docker-compose.yml
services:
  # ... other services ...
  
  image-generator:
    build: ./garage-image-service
    container_name: image-generator
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    networks:
      - garage-network
    ports:
      - "5001:5001"
    volumes:
      - ./garage-image-service/outputs:/app/service/outputs
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Call from Backend

```typescript
// Node.js/TypeScript
async function generateImage(params: BuildingParams): Promise<string> {
  const response = await fetch('http://image-generator:5001/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  const result = await response.json();
  return result.file_url;
}
```

## Support

For issues and questions:
- Check logs: `docker-compose logs -f`
- Review documentation: `/documentation/07-image-generation-service.md`
- Test health endpoint: `curl http://localhost:5001/health`

## Next Steps

1. ✅ Start the service
2. ✅ Generate test images
3. ✅ Integrate with main application
4. ✅ Customize prompts for your use case
5. ✅ Deploy to production
