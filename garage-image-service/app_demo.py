"""
Demo version of the image generation service for testing without GPU/ComfyUI.
This generates placeholder images to test the API and Streamlit integration.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import os
import json

app = FastAPI(
    title="Garage Image Generation Service (Demo)",
    description="Demo version for testing without GPU",
    version="1.0.0-demo"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
os.makedirs("outputs", exist_ok=True)
os.makedirs("static", exist_ok=True)

# Mount static files
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
app.mount("/static", StaticFiles(directory="static"), name="static")


class GenerateRequest(BaseModel):
    width: float
    length: float
    height: float
    roof_type: str
    color: str = "white"
    building_type: str = "garage"
    location: str = "suburban area"
    style: str = "modern"
    lighting: str = "daylight"
    additional_features: list[str] = []
    preview: bool = False


class GenerateResponse(BaseModel):
    status: str
    file_path: str
    file_url: str
    prompt_used: str
    generation_time: float
    image_size: dict


def generate_placeholder_image(params: dict, width: int, height: int) -> str:
    """Generate a placeholder image with building specifications."""
    
    # Create image
    img = Image.new('RGB', (width, height), color='#87CEEB')  # Sky blue background
    draw = ImageDraw.Draw(img)
    
    # Draw ground
    ground_y = int(height * 0.7)
    draw.rectangle([(0, ground_y), (width, height)], fill='#90EE90')  # Light green
    
    # Draw building
    building_width = int(width * 0.6)
    building_height = int(height * 0.4)
    building_x = (width - building_width) // 2
    building_y = ground_y - building_height
    
    # Building color map
    color_map = {
        'white': '#FFFFFF',
        'gray': '#808080',
        'grey': '#808080',
        'beige': '#F5F5DC',
        'brown': '#8B4513',
        'red': '#CD5C5C',
        'blue': '#4682B4'
    }
    building_color = color_map.get(params['color'].lower(), '#FFFFFF')
    
    # Draw building body
    draw.rectangle(
        [(building_x, building_y), (building_x + building_width, ground_y)],
        fill=building_color,
        outline='#000000',
        width=2
    )
    
    # Draw roof based on type
    roof_peak_y = building_y - int(building_height * 0.3)
    roof_type = params['roof_type'].lower()
    
    if roof_type == 'gable':
        # Triangular roof
        draw.polygon([
            (building_x, building_y),
            (building_x + building_width // 2, roof_peak_y),
            (building_x + building_width, building_y)
        ], fill='#8B4513', outline='#000000', width=2)
    elif roof_type == 'flat':
        # Flat roof
        draw.rectangle(
            [(building_x, roof_peak_y), (building_x + building_width, building_y)],
            fill='#696969',
            outline='#000000',
            width=2
        )
    else:
        # Default gable
        draw.polygon([
            (building_x, building_y),
            (building_x + building_width // 2, roof_peak_y),
            (building_x + building_width, building_y)
        ], fill='#8B4513', outline='#000000', width=2)
    
    # Draw door
    door_width = int(building_width * 0.4)
    door_height = int(building_height * 0.6)
    door_x = building_x + (building_width - door_width) // 2
    door_y = ground_y - door_height
    draw.rectangle(
        [(door_x, door_y), (door_x + door_width, ground_y)],
        fill='#654321',
        outline='#000000',
        width=2
    )
    
    # Add text with specifications
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Title
    title = f"{params['building_type'].upper()} - {params['style'].title()}"
    draw.text((20, 20), title, fill='#000000', font=font)
    
    # Specifications
    specs = [
        f"Size: {params['width']}' x {params['length']}' x {params['height']}'",
        f"Roof: {params['roof_type'].title()}",
        f"Color: {params['color'].title()}",
        f"Style: {params['style'].title()}"
    ]
    
    y_offset = 50
    for spec in specs:
        draw.text((20, y_offset), spec, fill='#000000', font=small_font)
        y_offset += 25
    
    # Watermark
    draw.text(
        (width - 200, height - 30),
        "DEMO - Placeholder Image",
        fill='#FF0000',
        font=small_font
    )
    
    # Save image
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{params['building_type']}_{timestamp}.png"
    filepath = os.path.join("outputs", filename)
    img.save(filepath)
    
    return filename


@app.get("/")
async def root():
    """Serve the web interface."""
    return FileResponse("static/index.html")


@app.post("/generate-image", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """
    Generate a placeholder image for testing.
    In production, this would call ComfyUI for AI generation.
    """
    try:
        start_time = datetime.now()
        
        # Build prompt (for metadata)
        prompt = f"A {request.style} {request.color} {request.building_type}, " \
                f"{request.width}ft x {request.length}ft x {request.height}ft, " \
                f"with {request.roof_type} roof, {request.lighting} lighting"
        
        # Determine image size
        if request.preview:
            img_width, img_height = 512, 512
        else:
            img_width, img_height = 1024, 768
        
        # Generate placeholder image
        params = request.dict()
        filename = generate_placeholder_image(params, img_width, img_height)
        file_path = os.path.join("outputs", filename)
        
        # Calculate generation time
        generation_time = (datetime.now() - start_time).total_seconds()
        
        # Save metadata
        metadata = {
            "request": params,
            "prompt": prompt,
            "filename": filename,
            "generation_time": generation_time,
            "timestamp": datetime.now().isoformat(),
            "image_size": {"width": img_width, "height": img_height},
            "demo_mode": True
        }
        
        with open(f"{file_path}.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return GenerateResponse(
            status="success",
            file_path=file_path,
            file_url=f"/outputs/{filename}",
            prompt_used=prompt,
            generation_time=generation_time,
            image_size={"width": img_width, "height": img_height}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.get("/outputs/{filename}")
async def get_image(filename: str):
    """Retrieve a generated image by filename."""
    file_path = os.path.join("outputs", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)


@app.get("/outputs")
async def list_outputs(limit: int = 50):
    """List all generated images with metadata."""
    files = []
    
    for filename in os.listdir("outputs"):
        if not filename.endswith('.png'):
            continue
        
        file_path = os.path.join("outputs", filename)
        stat = os.stat(file_path)
        
        # Load metadata
        metadata = None
        metadata_path = f"{file_path}.json"
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        
        files.append({
            "filename": filename,
            "size": stat.st_size,
            "size_mb": round(stat.st_size / (1024 * 1024), 2),
            "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "url": f"/outputs/{filename}",
            "metadata": metadata
        })
    
    files.sort(key=lambda x: x['created'], reverse=True)
    return {"files": files[:limit], "total": len(files)}


@app.delete("/outputs/{filename}")
async def delete_image(filename: str):
    """Delete a generated image and its metadata."""
    file_path = os.path.join("outputs", filename)
    metadata_path = f"{file_path}.json"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        os.remove(file_path)
        if os.path.exists(metadata_path):
            os.remove(metadata_path)
        return {"status": "success", "message": f"Deleted {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "image-generation-demo",
        "mode": "demo",
        "comfyui": "not_required",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    print("🎨 Starting Image Generation Service (DEMO MODE)")
    print("📝 This is a demo version that generates placeholder images")
    print("🚀 For AI-generated images, use the full Docker setup")
    print("")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5001)),
        log_level="info"
    )
