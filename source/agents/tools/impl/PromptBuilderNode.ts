import {InstantiationError} from "@errors/InstantiationError";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {IPromptBuilder} from "@agents/tools/impl/io/IVisualizationNode";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

/**
 * Builds detailed garage prompts from parameters
 * ✅ ENHANCED: Industrial corrugated metal garage - NOT residential
 */
export class PromptBuilder implements IPromptBuilder
{
    private readonly colorDescriptions: Record<string, string>;

    private static instance: IPromptBuilder;

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PromptBuilder.getInstance() instead of new.");
        }

        this.colorDescriptions = {
            "Barn Red": "industrial barn red",
            "Burgundy": "deep burgundy red",
            "Royal Blue": "industrial royal blue",
            "Evergreen": "forest evergreen",
            "Pewter Gray": "industrial pewter gray metallic",
            "White": "pure white industrial",
            "Black": "industrial matte black",
            "Clay": "clay brown",
            "Pebble Beige": "industrial pebble beige",
            "Earth Brown": "earth brown",
        };
    }

    public static getInstance(): IPromptBuilder
    {
        if(!PromptBuilder.instance)
        {
            PromptBuilder.instance = new PromptBuilder(Enforce);
        }

        return PromptBuilder.instance;
    }

    private getColorDescription(color: string): string
    {
        return this.colorDescriptions[color] || color.toLowerCase();
    }

    /**
     * ✅ ENHANCED: Industrial corrugated metal garage specifics
     */
    public buildGaragePrompt(params: UserFriendlyParams, selectedAddons?: any[]): string
    {
        const width: number = params.width || 20;
        const length: number = params.length || 20;
        const height: number = params.height || 10;
        const roofType: string = params.roof_type || "gable";
        const color: string = params.color || "white";

        const colorDesc: string = this.getColorDescription(color);

        const doorConfig = this.calculateDoorConfiguration(width, selectedAddons);

        logger.info(`[PromptBuilder] Building PREMIUM GARAGE configuration:`, {
            dimensions: `${width}×${length}×${height}ft`,
            aspectRatio: (width / length).toFixed(2),
            color: colorDesc,
            doors: doorConfig.totalDoors,
            roofType,
        });

        let roofDescription = "";
        let roofVisualDetail = "";
        const roofTypeLower = roofType.toLowerCase();

        if (roofTypeLower === 'box') {
            roofDescription = "modern flat-roof design with clean edges";
            roofVisualDetail = "sleek flat roofline with subtle soffit detailing, integrated gutters";
        } else if (roofTypeLower === 'vertical') {
            roofDescription = "contemporary pitched roof with architectural appeal";
            roofVisualDetail = "clean pitched roof with premium metal roofing panels or architectural shingles, refined ridge detail";
        } else if (roofTypeLower === 'gambrel') {
            roofDescription = "distinctive gambrel roof with traditional charm";
            roofVisualDetail = "elegant gambrel design with two roof slopes, premium finish, architectural interest";
        } else {
            roofDescription = "classic peaked gable roof";
            roofVisualDetail = "traditional peaked gable with refined proportions, premium roofing material";
        }

        let addonFeatures = "";
        if (selectedAddons && selectedAddons.length > 0) {
            const features = selectedAddons
                .filter(a => a && a.label)
                .map(a => {
                    const label = a.label.toLowerCase();
                    if (label.includes('window')) return 'premium glass windows with trim';
                    if (label.includes('walk-in')) return 'attractive personnel entry door with hardware';
                    if (label.includes('cupola')) return 'decorative roof cupola with weathervane';
                    if (label.includes('loft')) return 'elevated loft with windows';
                    return label;
                })
                .join(", ");
            addonFeatures = `Premium features: ${features}.`;
        }

        let doorDescription = "";
        let doorPositioning = "";
        if (doorConfig.totalDoors === 1) {
            doorDescription = "single attractive garage door with professional panel design";
            doorPositioning = "centered garage door";
        } else if (doorConfig.totalDoors === 2) {
            doorDescription = "two side-by-side attractive garage doors with professional panel design";
            doorPositioning = "two evenly-spaced garage doors";
        } else {
            doorDescription = `${doorConfig.totalDoors} attractive garage doors with professional panel design`;
            doorPositioning = `${doorConfig.totalDoors} evenly-spaced garage doors`;
        }

        const aspectRatio = width / length;
        let sideVisibility = "";
        if (aspectRatio > 1.3) {
            sideVisibility = "attractive wide structure with refined siding, prominent side elevation visible";
        } else if (aspectRatio < 0.7) {
            sideVisibility = "elegant deep structure with balanced proportions, full length visible";
        } else {
            sideVisibility = "well-proportioned structure showing front facade and attractive side elevation";
        }

        const materialDescription = `${colorDesc} exterior finish`;
        const wallFinish = `${colorDesc} professional exterior with smooth finish`;
        const wallTexture = "smooth professional exterior, quality construction";

        const prompt = `Professional photograph of a beautiful garage building with ${colorDesc} exterior finish, photographed in daylight from a 45-degree angle showing front and side walls, high-quality construction.

CRITICAL REQUIREMENTS:
• MUST BE: Garage building for vehicle storage (NOT a house, NOT residential home)
• COLOR: ${colorDesc} exterior (this exact color is CRITICAL)
• TYPE: Professional garage building, commercial quality
• STYLE: Beautiful, well-built garage with proper proportions
• CONSTRUCTION: Quality construction with professional exterior finish
• QUALITY: New, attractive, well-maintained, ready for customers

EXTERIOR APPEARANCE:
• Walls: ${colorDesc} professional exterior finish
• Material: Quality construction materials, ${materialDescription}
• Finish: ${wallFinish}
• Texture: ${wallTexture}
• Color: ${colorDesc} - exact color match required
• Look: Clean, attractive, professional garage building
• Condition: New construction, excellent condition, ready for delivery

ROOF DESIGN:
• Type: ${roofDescription}
• Details: ${roofVisualDetail}
• Finish: Premium roofing material, professional installation
• Overhang: Proper eave overhang with finished soffit
• Gutters: Integrated gutter system

GARAGE DOORS & ENTRY:
• Doors: ${doorDescription}
• Positioning: ${doorPositioning}
• Hardware: Quality hinges and handles, professional appearance
• Finish: Matching color scheme, coordinated with building
• Condition: Clean, well-maintained, closed and secure
${selectedAddons?.some(a => a.label.toLowerCase().includes('walk')) ? '• Entry door: Attractive personnel door with quality hardware' : ''}

WINDOWS & OPENINGS:
${selectedAddons?.some(a => a.label.toLowerCase().includes('window')) ? '• Windows: Premium windows with frames, positioned for aesthetics and function\n• Style: Modern windows with quality framing' : '• Minimal windows: Clean industrial aesthetic\n• Focus: Door and facade quality'}

BUILDING PROPORTIONS:
• Width: ${width} feet
• Depth: ${length} feet  
• Height: ${height} feet
• Proportions: Balanced and attractive
• Form: ${sideVisibility}

FOUNDATION & BASE:
• Foundation: Quality concrete pad, finished appearance
• Base: Clean concrete foundation visible at ground level
• Foreground: Professional landscaping or neat gravel area
• Site appearance: Well-maintained location

LIGHTING & ATMOSPHERE:
• Time: Bright daylight, golden hour or overcast
• Sky: Clear or softly overcast sky
• Lighting: Natural professional lighting, shadows for depth
• Quality: High detail, sharp focus, professional finish
• Mood: Clean, attractive, professional, sale-ready

VIEWING ANGLE & COMPOSITION:
• Angle: 45-degree perspective showing front and side
• Distance: Professional exterior shot
• Framing: Building prominently featured, centered composition
• Depth: Clear dimensional form, not flat appearance
• Orientation: Building corner prominent, showing 3D form
• Professional quality: Architectural photography standard

RENDERING QUALITY:
• Style: Photorealistic architectural rendering
• Resolution: High detail, 8K quality
• Focus: Sharp and clear throughout
• Finish: Professional architectural standards
• Appeal: Attractive and marketable appearance

${addonFeatures ? `SPECIAL FEATURES: ${addonFeatures}` : ''}

DESIGN PRIORITIES:
✓ MUST BE: Garage building for vehicles (NOT a house, NOT residential home)
✓ MUST be beautiful, attractive, and professional quality
✓ MUST match specifications: ${width}×${length}×${height} feet, ${roofTypeLower} roof
✓ MUST be ${colorDesc} color - exact match to specifications
✓ MUST show 45-degree angle with dimensional depth
✓ MUST look like a real garage building (NOT metal panels, NOT luxury home, NOT poor shed)
✓ MUST be well-built commercial quality construction
✓ MUST be ready for customer delivery
✓ Style: Beautiful professional garage, appropriate for selling to customers`;

        /**
         * ✅ FIXED NEGATIVE PROMPT: Exclude homes, metal panels, and poor quality
         */
        const negativePrompt = `residential house, home, dwelling, residential building, luxury home, mansion, villa, cottage, residential architecture, house with windows, residential siding, brick house, wood house, stucco house, residential design, living quarters, apartment, condo, townhouse, residential neighborhood, landscaped yard, decorative elements, ornate details, luxury finishes, upscale design, premium residential, modern home, contemporary house, traditional house, ranch house, colonial house, craftsman house, farmhouse style, metal panels, corrugated metal, metal siding, ribbed metal, industrial metal, sheet metal, bare metal, unpainted metal, rusty, corroded, weathered, deteriorated, old, rundown, dilapidated, poor condition, damaged, dented, scratched, peeling paint, faded, dirty, grimy, stained, abandoned, neglected, cheap looking, industrial warehouse, utility shed, farm building, shipping container, metal box, people, vehicles, cars, trucks, signage, text, logos, open doors, interior visible, wrong color, incorrect color, color mismatch, blurry, low quality, distorted, warped, asymmetrical, cartoon, illustration, sketch`;

        logger.info(`[PromptBuilder] Generated PREMIUM GARAGE prompt`);
        logger.info(`  - Material: Premium finish, AI-optimized`);
        logger.info(`  - Style: Premium custom garage, sale-ready`);
        logger.info(`  - Doors: ${doorConfig.totalDoors} quality garage doors`);
        logger.info(`  - Dimensions: ${width}×${length}×${height}`);

        (this as any)._lastNegativePrompt = negativePrompt;

        return prompt;
    }

    private calculateDoorConfiguration(width: number, selectedAddons?: any[]): { totalDoors: number; fromAddons: boolean }
    {

        let addonDoorCount: number = 0;
        if (selectedAddons && Array.isArray(selectedAddons))
        {
            selectedAddons.forEach(addon => {
                if (addon && addon.label && addon.label.toLowerCase().includes('door')) {
                    addonDoorCount++;
                }
            });
        }

        if (addonDoorCount > 0)
        {
            return { totalDoors: addonDoorCount, fromAddons: true };
        }

        let garageDoorCount: number = 1;
        if (width >= 30)
        {
            garageDoorCount = 2;
        }

        if (width >= 45)
        {
            garageDoorCount = 3;
        }

        return { totalDoors: garageDoorCount, fromAddons: false };
    }

    public buildUnifiedPrompt(): string
    {
        const sections: string[] = [
            this.buildSystemPrompt(),
        ];

        return sections.filter(Boolean).join("\n");
    }

    private buildSystemPrompt(): string
    {
        return `You are a building parameter extraction system.

CRITICAL: Return ONLY valid JSON. NO explanations, NO code.`;
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
