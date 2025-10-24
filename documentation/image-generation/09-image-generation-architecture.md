# Image Generation Service - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Container                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Supervisor                            │  │
│  │  ┌─────────────────────┐    ┌──────────────────────────┐  │  │
│  │  │   ComfyUI Service   │    │   FastAPI Service        │  │  │
│  │  │   Port: 8188        │◄───┤   Port: 5001             │  │  │
│  │  │                     │    │                          │  │  │
│  │  │  - SDXL Model       │    │  - REST API              │  │  │
│  │  │  - Image Generation │    │  - Web Interface         │  │  │
│  │  │  - GPU Processing   │    │  - Prompt Builder        │  │  │
│  │  └─────────────────────┘    └──────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────┐                         │
│                    │  NVIDIA GPU      │                         │
│                    │  CUDA 11.8       │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Volume Mounts   │
                    │  - outputs/      │
                    │  - models/       │
                    └──────────────────┘
```

## Request Flow

### 1. Web Interface Request

```
User Browser
    │
    │ HTTP GET /
    ▼
FastAPI App
    │
    │ Serve static/index.html
    ▼
User sees Web Interface
    │
    │ Fill form & submit
    │ POST /generate-image
    ▼
FastAPI App
```

### 2. Image Generation Flow

```
FastAPI Endpoint
    │
    │ 1. Validate request
    ▼
Prompt Builder
    │
    │ 2. Build detailed prompt
    │    - Building type
    │    - Dimensions
    │    - Style & features
    ▼
Image Generator
    │
    │ 3. Create ComfyUI workflow
    │    - Load SDXL model
    │    - Set parameters
    │    - Configure sampling
    ▼
ComfyUI API
    │
    │ 4. Queue generation
    │    POST /prompt
    ▼
ComfyUI Processing
    │
    │ 5. Generate image
    │    - Text encoding
    │    - Latent generation
    │    - VAE decoding
    │    - GPU processing
    ▼
Image Generator
    │
    │ 6. Poll for completion
    │    GET /history/{prompt_id}
    ▼
Storage Service
    │
    │ 7. Save image & metadata
    │    - outputs/garage_*.png
    │    - outputs/garage_*.json
    ▼
FastAPI Response
    │
    │ 8. Return result
    │    - file_url
    │    - generation_time
    │    - prompt_used
    ▼
User Browser
    │
    │ 9. Display image
    └─ Show in gallery
```

## Component Architecture

### FastAPI Application

```python
app.py
├── Endpoints
│   ├── GET  /              → Web interface
│   ├── POST /generate-image → Generate building
│   ├── GET  /outputs       → List images
│   ├── GET  /outputs/{id}  → Get image
│   ├── DELETE /outputs/{id}→ Delete image
│   └── GET  /health        → Health check
│
├── Middleware
│   └── CORS                → Cross-origin requests
│
├── Static Files
│   ├── /static/*           → Web interface
│   └── /outputs/*          → Generated images
│
└── Services
    ├── PromptBuilder       → Prompt composition
    ├── ImageGenerator      → ComfyUI interface
    └── StorageService      → File management
```

### Prompt Builder

```python
PromptBuilder
├── build_prompt()
│   ├── Parse parameters
│   ├── Select templates
│   ├── Compose description
│   └── Add quality tags
│
├── build_garage_prompt()
│   └── Garage-specific logic
│
├── build_shed_prompt()
│   └── Shed-specific logic
│
└── Templates
    ├── roof_descriptions
    ├── lighting_presets
    └── style_modifiers
```

### Image Generator

```python
ImageGenerator
├── generate()
│   ├── Build workflow JSON
│   ├── Queue to ComfyUI
│   └── Wait for completion
│
├── _build_workflow()
│   ├── KSampler node
│   ├── CheckpointLoader
│   ├── CLIPTextEncode
│   ├── VAEDecode
│   └── SaveImage
│
└── _wait_for_completion()
    ├── Poll history endpoint
    ├── Check for errors
    └── Fetch image data
```

### Storage Service

```python
StorageService
├── save_image()
│   └── Write PNG file
│
├── save_metadata()
│   └── Write JSON file
│
├── list_files()
│   ├── Scan directory
│   ├── Load metadata
│   └── Sort by date
│
└── get_storage_stats()
    └── Calculate totals
```

## Data Flow

### Request Data Structure

```json
{
  "building_type": "garage",
  "width": 20,
  "length": 24,
  "height": 10,
  "roof_type": "gable",
  "color": "white",
  "style": "modern",
  "lighting": "daylight",
  "additional_features": ["windows", "side door"],
  "preview": false
}
```

### Prompt Generation

```
Input Parameters
    ↓
Template Selection
    ↓
Description Composition
    ↓
Quality Enhancement
    ↓
Final Prompt:
"A modern white metal garage, 20ft wide by 24ft long, 
with traditional gable roof with peaked ends. Clean lines, 
contemporary design, minimalist aesthetic, with a concrete 
driveway, suburban neighborhood setting, featuring windows, 
side door. Natural daylight, clear blue sky, soft shadows, 
bright and airy. Exterior view, 3/4 angle perspective, 
professional architectural photography. Photorealistic, 
high quality, detailed, professional photography, 8k, 
sharp focus. Realistic materials and textures, accurate 
proportions, detailed environment."
```

### ComfyUI Workflow

```json
{
  "3": { "class_type": "KSampler", ... },
  "4": { "class_type": "CheckpointLoaderSimple", ... },
  "5": { "class_type": "EmptyLatentImage", ... },
  "6": { "class_type": "CLIPTextEncode", ... },
  "7": { "class_type": "CLIPTextEncode", ... },
  "8": { "class_type": "VAEDecode", ... },
  "9": { "class_type": "SaveImage", ... }
}
```

### Response Data Structure

```json
{
  "status": "success",
  "file_path": "/outputs/garage_20251024_153245.png",
  "file_url": "/outputs/garage_20251024_153245.png",
  "prompt_used": "A modern white metal garage...",
  "generation_time": 15.3,
  "image_size": {
    "width": 1024,
    "height": 768
  }
}
```

## Docker Architecture

### Container Structure

```
nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04
├── System Packages
│   ├── Python 3.10
│   ├── Git
│   ├── Wget
│   └── Supervisor
│
├── ComfyUI
│   ├── /app/ComfyUI/
│   ├── models/checkpoints/
│   │   └── sd_xl_base_1.0.safetensors
│   └── Port: 8188
│
├── Image Service
│   ├── /app/service/
│   ├── app.py
│   ├── services/
│   ├── static/
│   └── Port: 5001
│
└── Volumes
    ├── outputs/ (persistent)
    └── models/ (persistent)
```

### Network Architecture

```
Host Machine
    │
    ├── Port 5001 → FastAPI Service
    │   └── Web Interface & API
    │
    └── Port 8188 → ComfyUI (optional)
        └── Direct access for debugging
```

## Scaling Considerations

### Horizontal Scaling

```
Load Balancer
    │
    ├── Container 1 (GPU 0)
    ├── Container 2 (GPU 1)
    └── Container 3 (GPU 2)
        │
        └── Shared Storage
            └── NFS/S3 for outputs
```

### Queue-Based Architecture

```
API Server
    │
    ▼
Redis Queue
    │
    ├── Worker 1 (GPU 0)
    ├── Worker 2 (GPU 1)
    └── Worker 3 (GPU 2)
        │
        └── Results Storage
```

## Security Architecture

### Network Security

```
Internet
    │
    ▼
Reverse Proxy (nginx)
    │ HTTPS/TLS
    │ Rate Limiting
    │ Authentication
    ▼
FastAPI Service
    │ Internal Network
    ▼
ComfyUI Service
```

### File Security

```
User Request
    │
    ▼
Input Validation
    │
    ▼
Sanitization
    │
    ▼
Generation
    │
    ▼
Output Storage
    │ Read-only for users
    │ Automatic cleanup
    ▼
Delivery
```

## Monitoring Architecture

### Logging

```
Application Logs
    │
    ├── FastAPI → /var/log/supervisor/image-service.out.log
    └── ComfyUI → /var/log/supervisor/comfyui.out.log
        │
        └── Aggregation (optional)
            ├── ELK Stack
            └── CloudWatch
```

### Metrics

```
Application
    │
    ├── Generation Time
    ├── Request Count
    ├── Error Rate
    └── GPU Utilization
        │
        └── Prometheus
            └── Grafana Dashboard
```

### Health Checks

```
Docker Health Check
    │ Every 30s
    ▼
GET /health
    │
    ├── Check FastAPI
    ├── Check ComfyUI
    └── Check GPU
        │
        └── Status: healthy/unhealthy
```

## Performance Optimization

### Caching Strategy

```
Request
    │
    ▼
Hash Parameters
    │
    ▼
Check Cache
    │
    ├── Hit → Return cached image
    └── Miss → Generate new
        │
        └── Store in cache
```

### Resource Management

```
GPU Memory
    │
    ├── Model Loading (8GB)
    ├── Generation Buffer (2GB)
    └── Reserved (2GB)
        │
        └── Total: 12GB minimum
```

## Integration Points

### Main Application Integration

```
Garage Builder App
    │
    ├── User Input
    │   └── Building parameters
    │
    ├── Price Estimation
    │   └── Calculate costs
    │
    └── Image Generation
        │ HTTP Request
        ▼
    Image Service
        │
        └── Return visualization
```

### Webhook Integration

```
Image Service
    │ Generation complete
    ▼
Webhook Notification
    │
    ▼
Main Application
    │
    └── Update UI
        └── Show image to user
```

## Deployment Patterns

### Development

```
Local Machine
    └── docker-compose up
        └── Single container
            ├── ComfyUI
            └── FastAPI
```

### Production

```
Kubernetes Cluster
    │
    ├── Deployment
    │   ├── Replicas: 3
    │   └── GPU: 1 per pod
    │
    ├── Service
    │   └── Load Balancer
    │
    └── Persistent Volume
        └── Shared storage
```

## Conclusion

The Image Generation Service is architected for:

- ✅ **Simplicity**: Easy to deploy and use
- ✅ **Performance**: GPU-accelerated generation
- ✅ **Scalability**: Can be horizontally scaled
- ✅ **Reliability**: Health checks and monitoring
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Integration**: RESTful API for easy integration
