"""Streamlit page for AI-powered building image generation."""

import os
import time
import json
from typing import Optional

import httpx
import streamlit as st
from PIL import Image
from io import BytesIO

# Image generation service URL
IMAGE_GEN_URL = os.getenv("IMAGE_GEN_URL", "http://localhost:5001")

st.set_page_config(
    page_title="Building Image Generator",
    page_icon="🏗️",
    layout="wide"
)

# Initialize session state
if "generated_images" not in st.session_state:
    st.session_state.generated_images = []

if "current_params" not in st.session_state:
    st.session_state.current_params = {}


def generate_image(params: dict) -> Optional[dict]:
    """Call the image generation service."""
    try:
        with httpx.Client(timeout=180.0) as client:
            response = client.post(
                f"{IMAGE_GEN_URL}/generate-image",
                json=params
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        st.error(f"Failed to generate image: {str(e)}")
        return None
    except Exception as e:
        st.error(f"Unexpected error: {str(e)}")
        return None


def load_image_from_url(url: str) -> Optional[Image.Image]:
    """Load image from URL."""
    try:
        with httpx.Client() as client:
            response = client.get(f"{IMAGE_GEN_URL}{url}")
            response.raise_for_status()
            return Image.open(BytesIO(response.content))
    except Exception as e:
        st.error(f"Failed to load image: {str(e)}")
        return None


def get_gallery_images() -> list:
    """Fetch gallery images from the service."""
    try:
        with httpx.Client() as client:
            response = client.get(f"{IMAGE_GEN_URL}/outputs?limit=20")
            response.raise_for_status()
            data = response.json()
            return data.get("files", [])
    except Exception:
        return []


# Page header
st.title("🏗️ Building Image Generator")
st.markdown("Generate photorealistic visualizations of garages, sheds, and other buildings using AI")

# Create tabs
tab1, tab2 = st.tabs(["Generate New Image", "Gallery"])

with tab1:
    # Create two columns for form and preview
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Building Parameters")
        
        # Building type
        building_type = st.selectbox(
            "Building Type",
            ["garage", "shed", "carport", "barn"],
            help="Select the type of building to generate"
        )
        
        # Dimensions
        st.markdown("#### Dimensions (feet)")
        dim_col1, dim_col2, dim_col3 = st.columns(3)
        
        with dim_col1:
            width = st.number_input("Width", min_value=8, max_value=60, value=20, step=2)
        
        with dim_col2:
            length = st.number_input("Length", min_value=8, max_value=60, value=24, step=2)
        
        with dim_col3:
            height = st.number_input("Height", min_value=6, max_value=20, value=10, step=1)
        
        # Style options
        st.markdown("#### Style & Appearance")
        
        style_col1, style_col2 = st.columns(2)
        
        with style_col1:
            roof_type = st.selectbox(
                "Roof Type",
                ["gable", "hip", "gambrel", "flat", "a-frame", "shed", "mansard"],
                help="Select the roof style"
            )
            
            style = st.selectbox(
                "Architectural Style",
                ["modern", "rustic", "industrial", "traditional", "luxury"],
                help="Select the architectural style"
            )
        
        with style_col2:
            color = st.text_input("Color", value="white", help="Primary color of the building")
            
            lighting = st.selectbox(
                "Lighting",
                ["daylight", "sunset", "overcast", "morning", "afternoon", "dusk"],
                help="Lighting condition for the scene"
            )
        
        # Location
        location = st.text_input(
            "Location/Setting",
            value="suburban neighborhood",
            help="Description of the location or setting"
        )
        
        # Additional features
        st.markdown("#### Additional Features")
        features = st.multiselect(
            "Select features",
            ["windows", "side door", "overhead door", "skylights", "gutters", "trim"],
            default=["windows"]
        )
        
        # Preview mode
        preview_mode = st.checkbox(
            "Preview Mode (faster, lower resolution)",
            value=False,
            help="Generate 512x512 preview for faster results"
        )
        
        # Generate button
        if st.button("🎨 Generate Image", type="primary", use_container_width=True):
            # Build parameters
            params = {
                "building_type": building_type,
                "width": float(width),
                "length": float(length),
                "height": float(height),
                "roof_type": roof_type,
                "color": color,
                "style": style,
                "lighting": lighting,
                "location": location,
                "additional_features": features,
                "preview": preview_mode
            }
            
            st.session_state.current_params = params
            
            # Show progress
            with st.spinner("🎨 Generating your building image... This may take 15-30 seconds"):
                result = generate_image(params)
                
                if result:
                    # Add to session state
                    st.session_state.generated_images.insert(0, result)
                    st.success(f"✅ Image generated in {result['generation_time']:.2f} seconds!")
                    st.rerun()
    
    with col2:
        st.subheader("Generated Image")
        
        if st.session_state.generated_images:
            latest = st.session_state.generated_images[0]
            
            # Load and display image
            img = load_image_from_url(latest['file_url'])
            if img:
                st.image(img, use_container_width=True)
                
                # Show metadata
                with st.expander("📊 Generation Details"):
                    st.markdown(f"**Generation Time:** {latest['generation_time']:.2f}s")
                    st.markdown(f"**Image Size:** {latest['image_size']['width']}x{latest['image_size']['height']}")
                    st.markdown(f"**Prompt Used:**")
                    st.text(latest['prompt_used'])
                
                # Download button
                try:
                    with httpx.Client() as client:
                        img_response = client.get(f"{IMAGE_GEN_URL}{latest['file_url']}")
                        if img_response.status_code == 200:
                            st.download_button(
                                label="⬇️ Download Image",
                                data=img_response.content,
                                file_name=latest['file_url'].split('/')[-1],
                                mime="image/png",
                                use_container_width=True
                            )
                except Exception as e:
                    st.error(f"Download failed: {str(e)}")
        else:
            st.info("👆 Configure parameters and click 'Generate Image' to create your building visualization")
            
            # Show example
            st.markdown("### Example Output")
            st.markdown("""
            The AI will generate a photorealistic image based on your specifications:
            - Accurate dimensions and proportions
            - Realistic materials and textures
            - Professional architectural photography style
            - Customized lighting and environment
            """)

with tab2:
    st.subheader("📸 Recent Generations")
    
    # Refresh button
    if st.button("🔄 Refresh Gallery"):
        st.rerun()
    
    # Load gallery images
    gallery_images = get_gallery_images()
    
    if gallery_images:
        # Display in grid
        cols = st.columns(3)
        
        for idx, img_data in enumerate(gallery_images):
            col = cols[idx % 3]
            
            with col:
                # Load thumbnail
                img = load_image_from_url(img_data['url'])
                if img:
                    st.image(img, use_container_width=True)
                    
                    # Show info
                    st.caption(f"**{img_data['filename']}**")
                    st.caption(f"Size: {img_data['size_mb']} MB")
                    st.caption(f"Created: {img_data['created'][:10]}")
                    
                    # Show metadata if available
                    if img_data.get('metadata'):
                        with st.expander("Details"):
                            metadata = img_data['metadata']
                            if 'request' in metadata:
                                req = metadata['request']
                                st.write(f"Type: {req.get('building_type', 'N/A')}")
                                st.write(f"Size: {req.get('width')}x{req.get('length')}x{req.get('height')} ft")
                                st.write(f"Style: {req.get('style', 'N/A')}")
    else:
        st.info("No images generated yet. Go to 'Generate New Image' tab to create your first visualization!")

# Sidebar with service status
with st.sidebar:
    st.markdown("### 🔧 Service Status")
    
    try:
        with httpx.Client(timeout=5.0) as client:
            health_response = client.get(f"{IMAGE_GEN_URL}/health")
            if health_response.status_code == 200:
                health_data = health_response.json()
                st.success("✅ Service Online")
                st.caption(f"ComfyUI: {health_data.get('comfyui', 'unknown')}")
            else:
                st.error("⚠️ Service Unavailable")
    except Exception:
        st.error("❌ Service Offline")
        st.caption("Make sure the image generation service is running:")
        st.code("make image-gen-start")
    
    st.markdown("---")
    st.markdown("### 📚 Quick Guide")
    st.markdown("""
    **Building Types:**
    - **Garage**: Vehicle storage
    - **Shed**: Storage/workshop
    - **Carport**: Open structure
    - **Barn**: Agricultural building
    
    **Tips:**
    - Use preview mode for faster testing
    - Experiment with different styles
    - Try various lighting conditions
    - Add features for more detail
    """)
    
    st.markdown("---")
    st.markdown("### ⚡ Performance")
    st.markdown("""
    **Generation Times:**
    - Preview: 5-8 seconds
    - Standard: 15-25 seconds
    - High-res: 30-45 seconds
    """)
