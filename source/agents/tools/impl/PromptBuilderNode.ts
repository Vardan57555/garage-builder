import {InstantiationError} from "@errors/InstantiationError";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {IPromptBuilder} from "@agents/tools/impl/io/IVisualizationNode";
import {DimensionResult, ExtractionContext} from "@agents/tools/io/IParameterExtraction";
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
    public buildGaragePrompt(
        params: UserFriendlyParams,
        selectedAddons?: any[]
    ): string {
        const width: number = params.width || 20;
        const length: number = params.length || 20;
        const height: number = params.height || 10;
        const roofType: string = params.roof_type || "gable";
        const color: string = params.color || "white";

        const colorDesc: string = this.getColorDescription(color);

        // Calculate door configuration
        const doorConfig = this.calculateDoorConfiguration(width, selectedAddons);

        logger.info(`[PromptBuilder] Building PREMIUM GARAGE configuration:`, {
            dimensions: `${width}×${length}×${height}ft`,
            aspectRatio: (width / length).toFixed(2),
            color: colorDesc,
            doors: doorConfig.totalDoors,
            roofType,
        });

        // Determine roof description - premium finishes
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

        // Build addon specification
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

        // Door description - beautiful garage doors
        let doorDescription = "";
        let doorPositioning = "";
        if (doorConfig.totalDoors === 1) {
            doorDescription = "single premium panel garage door with modern design, aluminum frame and panels with subtle detail";
            doorPositioning = "centered premium garage door with elegant hardware";
        } else if (doorConfig.totalDoors === 2) {
            doorDescription = "two side-by-side premium panel garage doors with contemporary styling, aluminum construction";
            doorPositioning = "two elegantly-spaced modern garage doors";
        } else {
            doorDescription = `${doorConfig.totalDoors} premium panel garage doors with coordinated design`;
            doorPositioning = `${doorConfig.totalDoors} evenly-spaced modern garage doors`;
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

        // Professional exterior materials - AI will choose best appearance
        const materialDescription = "premium siding with professional finish";
        const wallFinish = "attractive modern exterior cladding with quality craftsmanship";
        const wallTexture = "clean finished exterior, professional architectural styling";

        const prompt = `Professional architectural photograph of a premium custom garage building, ${colorDesc}, photographed in bright daylight from a 45-degree angle showing dimensional depth.

BUILDING CHARACTERISTICS:
• Type: Standard custom garage, clean modern construction
• Style: Contemporary design with professional finish
• Quality: Well-built construction, market-ready appearance
• Purpose: Vehicle storage, equipment garage, or workshop space
• Aesthetic: Clean, functional, professional-grade facility

EXTERIOR MATERIALS & FINISH:
• Primary material: ${materialDescription}
• Wall finish: ${wallFinish}
• Surface texture: ${wallTexture}
• Details: Quality craftsmanship, professional installation
• Trim: Clean trim work, finished edges

ROOF DESIGN:
• Type: ${roofDescription}
• Details: ${roofVisualDetail}
• Finish: Premium roofing material, professional installation
• Overhang: Proper eave overhang with finished soffit
• Gutters: Integrated gutter system

GARAGE DOORS & ENTRY:
• Doors: ${doorDescription}
• Positioning: ${doorPositioning}
• Hardware: Standard quality hardware, professional appearance
• Finish: Matching color scheme, coordinated with building
• Condition: Clean, well-maintained, closed and secure
${selectedAddons?.some(a => a.label.toLowerCase().includes('walk')) ? '• Entry door: Personnel door with quality hardware' : ''}

WINDOWS & OPENINGS:
${selectedAddons?.some(a => a.label.toLowerCase().includes('window')) ? '• Windows: Standard windows with frames, functional design\n• Style: Modern windows with standard framing' : '• No windows: Clean functional aesthetic\n• Focus: Door and facade'}

BUILDING PROPORTIONS:
• Width: ${width} feet
• Depth: ${length} feet  
• Height: ${height} feet
• Proportions: Balanced appearance
• Form: ${sideVisibility}

FOUNDATION & BASE:
• Foundation: Concrete pad, finished appearance
• Base: Clean concrete foundation visible
• Foreground: Professional gravel or paved area
• Site appearance: Well-maintained location

LIGHTING & ATMOSPHERE:
• Time: Bright daylight, natural lighting
• Sky: Clear or softly overcast sky
• Lighting: Natural professional lighting
• Quality: High detail, sharp focus, professional finish
• Mood: Clean, functional, professional

VIEWING ANGLE & COMPOSITION:
• Angle: 45-degree perspective showing front and side
• Distance: Professional exterior shot
• Framing: Building prominently featured
• Depth: Clear dimensional form
• Orientation: Building corner prominent, showing 3D form
• Professional quality: Standard architectural style

RENDERING QUALITY:
• Style: Photorealistic architectural rendering
• Resolution: High detail, clear quality
• Focus: Sharp and clear throughout
• Finish: Professional standards
• Appeal: Clean and attractive appearance

${addonFeatures ? `SPECIAL FEATURES: ${addonFeatures}` : ''}

DESIGN PRIORITIES:
✓ MUST show exactly ${doorConfig.totalDoors} garage door(s) - NO EXTRA DOORS
✓ MUST be clean and professional appearance
✓ MUST show quality construction
✓ MUST show 45-degree angle with dimensional depth
✓ MUST be functional and practical
✓ Dimensions: ${width}×${length}×${height} feet`;

        /**
         * REFINED NEGATIVE PROMPT: Focus on quality, not industrial
         */
        const negativePrompt = `cheap, poor quality, rundown, dilapidated, rusty, deteriorated, weathered, abandoned, poorly built, ugly, industrial warehouse, utilitarian, bare metal, corrugated metal texture, visible ribs, heavy gauge metal, commercial utility building, farming building, dull colors, boring, plain, basic construction, low quality materials, unfinished, rough texture, harsh shadows, too dark, too bright, overexposed, underexposed, distorted, warped, asymmetrical, low resolution, blurry, pixelated, cartoon, illustration, sketch, artificial appearance, obvious CGI, rendering artifacts, people, vehicles, signage, text, logos, luxury garage, high-end garage, premium materials, fancy doors, extra doors, additional doors, three doors, multiple side doors, personnel doors on front`;

        logger.info(`[PromptBuilder] Generated PREMIUM GARAGE prompt`);
        logger.info(`  - Material: Premium finish, AI-optimized`);
        logger.info(`  - Style: Premium custom garage, sale-ready`);
        logger.info(`  - Doors: ${doorConfig.totalDoors} quality garage doors`);
        logger.info(`  - Dimensions: ${width}×${length}×${height}`);

        (this as any)._lastNegativePrompt = negativePrompt;

        return prompt;
    }

    public getLastNegativePrompt(): string {
        return (this as any)._lastNegativePrompt || "residential home, house, dwelling, no depth, open doors";
    }

    private calculateDoorConfiguration(
        width: number,
        selectedAddons?: any[]
    ): { totalDoors: number; fromAddons: boolean } {

        let addonDoorCount = 0;
        if (selectedAddons && Array.isArray(selectedAddons)) {
            selectedAddons.forEach(addon => {
                if (addon && addon.label && addon.label.toLowerCase().includes('door')) {
                    addonDoorCount++;
                }
            });
        }

        if (addonDoorCount > 0) {
            return { totalDoors: addonDoorCount, fromAddons: true };
        }

        let garageDoorCount = 1;
        if (width >= 30) garageDoorCount = 2;
        if (width >= 45) garageDoorCount = 3;

        return { totalDoors: garageDoorCount, fromAddons: false };
    }

    public buildUnifiedPrompt(context: ExtractionContext, calculation: DimensionResult): string {
        const sections: string[] = [
            this.buildSystemPrompt(),
        ];

        return sections.filter(Boolean).join("\n");
    }

    private buildSystemPrompt(): string {
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
