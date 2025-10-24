import requests
import json
import time
import uuid
from typing import Optional


class ImageGenerator:
    """
    Interface to ComfyUI for image generation.
    Handles communication with ComfyUI API and manages image generation workflow.
    """
    
    def __init__(self, comfyui_url: str = "http://localhost:8188"):
        """
        Initialize the image generator.
        
        Args:
            comfyui_url: Base URL for ComfyUI API
        """
        self.comfyui_url = comfyui_url
        self.default_width = 1024
        self.default_height = 768
        self.default_steps = 30
        self.default_cfg = 7.5
    
    async def generate(
        self,
        prompt: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        steps: Optional[int] = None,
        cfg_scale: Optional[float] = None,
        seed: int = None
    ) -> bytes:
        """
        Generate an image using ComfyUI API.
        
        Args:
            prompt: Text prompt for image generation
            width: Image width in pixels
            height: Image height in pixels
            steps: Number of sampling steps
            cfg_scale: Classifier-free guidance scale
            seed: Random seed (-1 for random)
            
        Returns:
            Image data as bytes
            
        Raises:
            Exception: If image generation fails
        """
        width = width or self.default_width
        height = height or self.default_height
        steps = steps or self.default_steps
        cfg_scale = cfg_scale or self.default_cfg
        
        # Generate random seed if not provided
        if seed is None:
            import random
            seed = random.randint(0, 2**32 - 1)
        
        # Generate unique client ID
        client_id = str(uuid.uuid4())
        
        # Build ComfyUI workflow
        workflow = self._build_workflow(
            prompt=prompt,
            width=width,
            height=height,
            steps=steps,
            cfg_scale=cfg_scale,
            seed=seed
        )
        
        try:
            # Queue the prompt
            response = requests.post(
                f"{self.comfyui_url}/prompt",
                json={
                    "prompt": workflow,
                    "client_id": client_id
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"ComfyUI request failed: {response.text}")
            
            result = response.json()
            prompt_id = result["prompt_id"]
            
            # Wait for completion and get image
            image_data = self._wait_for_completion(prompt_id)
            
            return image_data
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to connect to ComfyUI: {str(e)}")
    
    def _build_workflow(
        self,
        prompt: str,
        width: int,
        height: int,
        steps: int,
        cfg_scale: float,
        seed: int
    ) -> dict:
        """
        Build the ComfyUI workflow JSON.
        
        Args:
            prompt: Text prompt
            width: Image width
            height: Image height
            steps: Sampling steps
            cfg_scale: CFG scale
            seed: Random seed
            
        Returns:
            Workflow dictionary
        """
        return {
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": cfg_scale,
                    "sampler_name": "euler_ancestral",
                    "scheduler": "normal",
                    "denoise": 1.0,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                }
            },
            "4": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": "sd_xl_base_1.0.safetensors"
                }
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                }
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]
                }
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, signature",
                    "clip": ["4", 1]
                }
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                }
            },
            "9": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "garage_gen",
                    "images": ["8", 0]
                }
            }
        }
    
    def _wait_for_completion(self, prompt_id: str, timeout: int = 120) -> bytes:
        """
        Poll ComfyUI for completion and retrieve the generated image.
        
        Args:
            prompt_id: ID of the queued prompt
            timeout: Maximum wait time in seconds
            
        Returns:
            Image data as bytes
            
        Raises:
            Exception: If generation times out or fails
        """
        start_time = time.time()
        
        while (time.time() - start_time) < timeout:
            try:
                # Check history for completion
                history_response = requests.get(
                    f"{self.comfyui_url}/history/{prompt_id}"
                )
                
                if history_response.status_code != 200:
                    time.sleep(2)
                    continue
                
                history = history_response.json()
                
                # Check if prompt is in history and has outputs
                if prompt_id in history:
                    prompt_history = history[prompt_id]
                    
                    # Check for errors
                    if "status" in prompt_history:
                        status = prompt_history["status"]
                        if status.get("status_str") == "error":
                            error_msg = status.get("messages", ["Unknown error"])
                            raise Exception(f"Generation failed: {error_msg}")
                    
                    # Check for outputs
                    if "outputs" in prompt_history:
                        outputs = prompt_history["outputs"]
                        
                        # Find the SaveImage node output
                        for node_id, node_output in outputs.items():
                            if "images" in node_output and len(node_output["images"]) > 0:
                                image_info = node_output["images"][0]
                                
                                # Construct image URL
                                filename = image_info["filename"]
                                subfolder = image_info.get("subfolder", "")
                                image_type = image_info.get("type", "output")
                                
                                # Build view URL
                                params = {
                                    "filename": filename,
                                    "type": image_type
                                }
                                if subfolder:
                                    params["subfolder"] = subfolder
                                
                                # Fetch the image
                                image_url = f"{self.comfyui_url}/view"
                                image_response = requests.get(image_url, params=params)
                                
                                if image_response.status_code == 200:
                                    return image_response.content
                                else:
                                    raise Exception(f"Failed to fetch image: {image_response.status_code}")
                
                # Wait before next poll
                time.sleep(2)
                
            except requests.exceptions.RequestException as e:
                raise Exception(f"Error polling ComfyUI: {str(e)}")
        
        raise Exception(f"Image generation timeout after {timeout} seconds")
    
    def check_health(self) -> dict:
        """
        Check if ComfyUI is accessible and get system stats.
        
        Returns:
            Dictionary with health status and system info
        """
        try:
            response = requests.get(f"{self.comfyui_url}/system_stats", timeout=5)
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "stats": response.json()
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": f"Status code: {response.status_code}"
                }
        except Exception as e:
            return {
                "status": "unreachable",
                "error": str(e)
            }
