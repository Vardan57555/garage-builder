# 🌐 Access Guide - Garage Builder Services

## Available Interfaces

### 1. 🏗️ Main Garage Builder (Streamlit)
**URL**: http://localhost:8501  
**Port**: 8501  
**Purpose**: Main application with chat interface and garage building features  
**Status**: ✅ Running

**Features**:
- Chat interface for garage queries
- Pricing estimation
- Building configuration
- **NEW**: Image Generator page (in sidebar)

---

### 2. 🎨 Image Generation Web UI (Standalone)
**URL**: http://localhost:5001  
**Port**: 5001  
**Purpose**: Dedicated image generation interface  
**Status**: ✅ Running (Demo Mode)

**Features**:
- **Generate Tab**: Create building images with custom parameters
- **Gallery Tab**: Browse all generated images
- Real-time generation
- Download images
- View metadata

**How to Access**:
1. Open your browser
2. Go to: **http://localhost:5001**
3. You'll see the standalone image generation interface

---

### 3. 🔌 Image Generation API
**URL**: http://localhost:5001/generate-image  
**Port**: 5001  
**Purpose**: REST API for programmatic access  
**Status**: ✅ Running

**Example Usage**:
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

---

### 4. 🗄️ phpMyAdmin (Database)
**URL**: http://localhost:8080  
**Port**: 8080  
**Purpose**: Database management  
**Status**: ✅ Running

---

### 5. 🔧 Backend API
**URL**: http://localhost:5003  
**Port**: 5003  
**Purpose**: Main backend API  
**Status**: ✅ Running

---

## Quick Access Summary

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| **Main App (Streamlit)** | http://localhost:8501 | 8501 | Garage builder interface |
| **Image Generator UI** | http://localhost:5001 | 5001 | Standalone image generation |
| **Image API** | http://localhost:5001/generate-image | 5001 | REST API |
| **phpMyAdmin** | http://localhost:8080 | 8080 | Database management |
| **Backend API** | http://localhost:5003 | 5003 | Main API |

---

## Testing the Image Generator UI

### Option 1: Standalone Web Interface (Port 5001)

1. **Open your browser**
2. **Navigate to**: http://localhost:5001
3. **You'll see**:
   - Clean, modern interface
   - Form with building parameters
   - Generate button
   - Gallery of generated images

4. **Fill in the form**:
   - Building Type: garage/shed/carport/barn
   - Dimensions: width, length, height
   - Roof Type: gable, hip, flat, etc.
   - Color: any color
   - Style: modern, rustic, industrial, etc.
   - Lighting: daylight, sunset, overcast, etc.

5. **Click "Generate Image"**
   - Image generates in ~0.03 seconds (demo mode)
   - View result immediately
   - Download if needed

6. **Browse Gallery**
   - See all previously generated images
   - Click to view full size
   - See metadata for each image

### Option 2: Streamlit Integration (Port 8501)

1. **Open**: http://localhost:8501
2. **Click** "Image Generator" in the sidebar
3. **Same interface** integrated into your main app

### Option 3: API (Programmatic)

```bash
# Generate image
curl -X POST http://localhost:5001/generate-image \
  -H "Content-Type: application/json" \
  -d '{"width":20,"length":24,"height":10,"roof_type":"gable","color":"white","building_type":"garage"}'

# List images
curl http://localhost:5001/outputs

# Health check
curl http://localhost:5001/health
```

---

## Current Status

```
✅ Main App (Streamlit)         - Port 8501 - Running
✅ Image Generator UI            - Port 5001 - Running (Demo)
✅ Image Generator API           - Port 5001 - Running
✅ Backend API                   - Port 5003 - Running
✅ Database (phpMyAdmin)         - Port 8080 - Running
✅ Ollama (AI)                   - Port 11434 - Running
```

---

## Screenshots / What You'll See

### Image Generator UI (Port 5001)

**Main Interface**:
- Purple gradient background
- Clean form with all parameters
- Two tabs: "Generate New Image" and "Gallery"
- Real-time generation
- Responsive design

**Generate Tab**:
```
┌─────────────────────────────────────────────┐
│  🏗️ Building Image Generator                │
│                                             │
│  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Form       │  │  Generated Image    │  │
│  │             │  │                     │  │
│  │ Type: ▼     │  │  [Image Preview]    │  │
│  │ Width: 20   │  │                     │  │
│  │ Length: 24  │  │  Generation: 0.03s  │  │
│  │ Height: 10  │  │  Size: 1024x768     │  │
│  │ Roof: ▼     │  │                     │  │
│  │ Color: ___  │  │  [Download Button]  │  │
│  │ Style: ▼    │  │                     │  │
│  │             │  │                     │  │
│  │ [Generate]  │  │                     │  │
│  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Gallery Tab**:
```
┌─────────────────────────────────────────────┐
│  📸 Recent Generations                      │
│                                             │
│  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ Image1 │  │ Image2 │  │ Image3 │       │
│  │        │  │        │  │        │       │
│  │ Garage │  │  Shed  │  │Carport │       │
│  │ 0.01MB │  │ 0.01MB │  │ 0.01MB │       │
│  └────────┘  └────────┘  └────────┘       │
└─────────────────────────────────────────────┘
```

---

## How to Use

### For Testing/Development (Current - Demo Mode)
```bash
# Already running! Just open:
open http://localhost:5001

# Or test API:
curl -X POST http://localhost:5001/generate-image \
  -H "Content-Type: application/json" \
  -d '{"width":20,"length":24,"height":10,"roof_type":"gable","color":"white","building_type":"garage"}'
```

### For Production (AI-Generated Images)
```bash
# Stop demo
make image-gen-demo-stop

# Build and start production version
make image-gen-build    # Takes 10-15 minutes
make image-gen-start

# Then access same URL:
open http://localhost:5001
```

---

## Troubleshooting

### Can't Access Port 5001?

**Check if service is running**:
```bash
docker ps | grep image-generator
```

**Check logs**:
```bash
make image-gen-demo-logs
```

**Restart service**:
```bash
make image-gen-demo-stop
make image-gen-demo
```

### Can't Access Port 8501?

**Check Streamlit**:
```bash
docker ps | grep streamlit
docker logs streamlit-client
```

**Restart Streamlit**:
```bash
docker restart streamlit-client
```

---

## Summary

You now have **TWO separate interfaces**:

1. **Main Garage Builder** (Port 8501)
   - Your existing Streamlit application
   - Chat interface
   - Garage configuration
   - Plus: Image Generator page integrated

2. **Standalone Image Generator** (Port 5001)
   - Dedicated web UI for image generation
   - Independent from main app
   - Can be used separately
   - Has its own API

**Both are running and accessible right now!** ✅

Just open http://localhost:5001 in your browser to see the standalone image generation interface.
