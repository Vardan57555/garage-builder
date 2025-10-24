from typing import List, Optional


class PromptBuilder:
    """
    Builds detailed prompts for image generation based on building parameters.
    """
    
    def __init__(self):
        self.base_quality = "photorealistic, high quality, detailed, professional photography, 8k, sharp focus"
        self.negative_prompt = "blurry, low quality, distorted, cartoon, sketch, unrealistic, deformed, ugly, bad anatomy"
        
        # Roof type descriptions
        self.roof_descriptions = {
            "gable": "traditional gable roof with peaked ends",
            "hip": "hip roof with slopes on all four sides",
            "gambrel": "gambrel barn-style roof with double slopes",
            "flat": "modern flat roof design",
            "a-frame": "A-frame peaked roof",
            "shed": "single-slope shed roof",
            "mansard": "mansard roof with four sides and double slopes"
        }
        
        # Lighting presets
        self.lighting_presets = {
            "daylight": "natural daylight, clear blue sky, soft shadows, bright and airy",
            "sunset": "golden hour lighting, warm orange tones, long dramatic shadows, beautiful sky",
            "overcast": "diffused lighting, cloudy sky, even illumination, soft light",
            "morning": "early morning light, fresh atmosphere, gentle shadows, crisp air",
            "afternoon": "afternoon sunlight, clear visibility, moderate shadows",
            "dusk": "twilight lighting, purple and blue tones, ambient glow"
        }
        
        # Style modifiers
        self.style_modifiers = {
            "modern": "clean lines, contemporary design, minimalist aesthetic",
            "rustic": "weathered wood, natural materials, countryside charm",
            "industrial": "metal construction, utilitarian design, commercial grade",
            "traditional": "classic design, timeless appeal, conventional architecture",
            "luxury": "premium materials, high-end finishes, upscale appearance"
        }
    
    def build_prompt(
        self,
        building_type: str,
        width: float,
        length: float,
        height: float,
        roof_type: str,
        color: str,
        location: str,
        style: str,
        lighting: str,
        features: Optional[List[str]] = None
    ) -> str:
        """
        Construct a detailed prompt for image generation.
        
        Args:
            building_type: Type of building (garage, shed, etc.)
            width: Building width in feet
            length: Building length in feet
            height: Building height in feet
            roof_type: Type of roof
            color: Primary color of the building
            location: Location/setting description
            style: Architectural style
            lighting: Lighting condition
            features: Additional features list
            
        Returns:
            Detailed prompt string for image generation
        """
        
        # Dimension description
        size_desc = f"{int(width)}ft wide by {int(length)}ft long"
        
        # Get roof description
        roof_desc = self.roof_descriptions.get(roof_type.lower(), roof_type)
        
        # Get style modifier
        style_mod = self.style_modifiers.get(style.lower(), style)
        
        # Building type specific details
        if building_type.lower() == "garage":
            structure_desc = f"A {style} {color} metal garage building"
            context = f"with a concrete driveway, {location} setting"
            typical_features = "overhead garage door, side entry door"
        elif building_type.lower() == "shed":
            structure_desc = f"A {style} {color} storage shed"
            context = f"in a well-maintained backyard, {location}"
            typical_features = "double doors, small windows"
        elif building_type.lower() == "carport":
            structure_desc = f"A {style} {color} metal carport"
            context = f"open-sided structure, {location}"
            typical_features = "support columns, open design"
        elif building_type.lower() == "barn":
            structure_desc = f"A {style} {color} barn building"
            context = f"rural setting, {location}"
            typical_features = "large sliding doors, loft area"
        else:
            structure_desc = f"A {style} {color} {building_type}"
            context = f"in a {location}"
            typical_features = ""
        
        # Additional features
        features_desc = ""
        if features and len(features) > 0:
            features_list = ", ".join(features)
            features_desc = f", featuring {features_list}"
        elif typical_features:
            features_desc = f", with {typical_features}"
        
        # Get lighting description
        lighting_desc = self.lighting_presets.get(lighting.lower(), lighting)
        
        # Compose final prompt
        prompt = f"""{structure_desc}, {size_desc}, with {roof_desc}.
{style_mod}, {context}{features_desc}.
{lighting_desc}.
Exterior view, 3/4 angle perspective, professional architectural photography.
{self.base_quality}.
Realistic materials and textures, accurate proportions, detailed environment."""
        
        return prompt.strip()
    
    def build_garage_prompt(
        self,
        width: float,
        length: float,
        height: float,
        roof_type: str,
        color: str,
        doors: int = 2,
        windows: bool = False,
        style: str = "modern"
    ) -> str:
        """
        Specialized prompt builder for garages.
        
        Args:
            width: Garage width in feet
            length: Garage length in feet  
            height: Garage height in feet
            roof_type: Type of roof
            color: Primary color
            doors: Number of garage doors
            windows: Whether to include windows
            style: Architectural style
            
        Returns:
            Garage-specific prompt
        """
        features = []
        
        if doors == 1:
            features.append("single overhead garage door")
        elif doors == 2:
            features.append("double overhead garage doors")
        elif doors == 3:
            features.append("triple overhead garage doors")
        
        if windows:
            features.append("windows on the side walls")
        
        features.append("side entry door")
        
        return self.build_prompt(
            building_type="garage",
            width=width,
            length=length,
            height=height,
            roof_type=roof_type,
            color=color,
            location="suburban neighborhood",
            style=style,
            lighting="daylight",
            features=features
        )
    
    def build_shed_prompt(
        self,
        width: float,
        length: float,
        height: float,
        roof_type: str,
        material: str = "wood",
        door_type: str = "double",
        windows: int = 0,
        style: str = "rustic"
    ) -> str:
        """
        Specialized prompt builder for sheds.
        
        Args:
            width: Shed width in feet
            length: Shed length in feet
            height: Shed height in feet
            roof_type: Type of roof
            material: Primary material (wood, metal, vinyl)
            door_type: Door configuration
            windows: Number of windows
            style: Architectural style
            
        Returns:
            Shed-specific prompt
        """
        features = []
        
        if door_type == "double":
            features.append("double doors at the front")
        elif door_type == "single":
            features.append("single entry door")
        
        if windows > 0:
            features.append(f"{windows} window{'s' if windows > 1 else ''}")
        
        color_map = {
            "wood": "natural wood",
            "metal": "gray metal",
            "vinyl": "white vinyl"
        }
        color = color_map.get(material.lower(), material)
        
        return self.build_prompt(
            building_type="shed",
            width=width,
            length=length,
            height=height,
            roof_type=roof_type,
            color=color,
            location="backyard garden setting",
            style=style,
            lighting="daylight",
            features=features
        )
    
    def get_negative_prompt(self) -> str:
        """
        Return the negative prompt to avoid unwanted elements.
        
        Returns:
            Negative prompt string
        """
        return self.negative_prompt
