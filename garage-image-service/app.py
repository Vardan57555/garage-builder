from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import os
import sys

# Add services to path
sys.path.append(os.path.dirname(__file__))

from services.prompt_builder import PromptBuilder
from services.image_generator import ImageGenerator
from services.storage import StorageService

app = FastAPI(
    title="Garage Image Generation Service",
    description="AI-powered image generation for garages and sheds",
    version="1.0.0"
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

# Initialize services
prompt_builder = PromptBuilder()
image_generator = ImageGenerator(comfyui_url=os.getenv("COMFYUI_URL", "http://localhost:8188"))
storage = StorageService(output_dir="outputs")


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
    preview: bool = False  # Generate smaller preview image


class GenerateResponse(BaseModel):
    status: str
    file_path: str
    file_url: str
    prompt_used: str
    generation_time: float
    image_size: dict


@app.get("/")
async def root():
    """Serve the web interface."""
    return FileResponse("static/index.html")


@app.post("/generate-image", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """
    Generate a photorealistic image of a garage or shed based on parameters.
    
    Args:
        request: Building parameters including dimensions, style, and features
        
    Returns:
        GenerateResponse with image URL and metadata
    """
    try:
        start_time = datetime.now()
        
        # Build prompt from parameters
        prompt = prompt_builder.build_prompt(
            building_type=request.building_type,
            width=request.width,
            length=request.length,
            height=request.height,
            roof_type=request.roof_type,
            color=request.color,
            location=request.location,
            style=request.style,
            lighting=request.lighting,
            features=request.additional_features
        )
        
        # Determine image size
        if request.preview:
            width, height = 512, 512
        else:
            width, height = 1024, 768
        
        # Generate image
        image_data = await image_generator.generate(prompt, width=width, height=height)
        
        # Save image
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{request.building_type}_{timestamp}.png"
        file_path = storage.save_image(image_data, filename)
        
        # Calculate generation time
        generation_time = (datetime.now() - start_time).total_seconds()
        
        # Save metadata
        metadata = {
            "request": request.dict(),
            "prompt": prompt,
            "filename": filename,
            "generation_time": generation_time,
            "timestamp": timestamp,
            "image_size": {"width": width, "height": height}
        }
        storage.save_metadata(metadata, f"{filename}.json")
        
        return GenerateResponse(
            status="success",
            file_path=file_path,
            file_url=f"/outputs/{filename}",
            prompt_used=prompt,
            generation_time=generation_time,
            image_size={"width": width, "height": height}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@app.get("/outputs/{filename}")
async def get_image(filename: str):
    """
    Retrieve a generated image by filename.
    
    Args:
        filename: Name of the image file
        
    Returns:
        Image file
    """
    file_path = os.path.join("outputs", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)


@app.get("/outputs")
async def list_outputs(limit: int = 50):
    """
    List all generated images with metadata.
    
    Args:
        limit: Maximum number of files to return
        
    Returns:
        List of image files with metadata
    """
    files = storage.list_files()
    return {"files": files[:limit], "total": len(files)}


@app.delete("/outputs/{filename}")
async def delete_image(filename: str):
    """
    Delete a generated image and its metadata.
    
    Args:
        filename: Name of the image file to delete
        
    Returns:
        Success message
    """
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
        raise HTTPException(status_code=500, detail=f"Failed to delete image: {str(e)}")


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Service health status
    """
    # Check if ComfyUI is accessible
    comfyui_status = "unknown"
    try:
        import requests
        response = requests.get(f"{image_generator.comfyui_url}/system_stats", timeout=2)
        comfyui_status = "healthy" if response.status_code == 200 else "unhealthy"
    except:
        comfyui_status = "unreachable"
    
    return {
        "status": "healthy",
        "service": "image-generation",
        "comfyui": comfyui_status,
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5001)),
        log_level="info"
    )
