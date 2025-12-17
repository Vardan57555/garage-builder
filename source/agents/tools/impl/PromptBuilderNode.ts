import {InstantiationError} from "@errors/InstantiationError";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {IPromptBuilder} from "@agents/tools/impl/io/IVisualizationNode";
import {DimensionResult, ExtractionContext} from "@agents/tools/io/IParameterExtraction";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

/**
 * Builds detailed garage prompts from parameters
 * ✅ ENHANCED: Better 3/4 angle view showing front AND side
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
            "Barn Red": "barn red",
            "Burgundy": "burgundy red",
            "Royal Blue": "royal blue",
            "Evergreen": "dark evergreen",
            "Pewter Gray": "pewter gray metallic",
            "White": "bright white",
            "Black": "matte black",
            "Clay": "clay brown",
            "Pebble Beige": "warm pebble beige",
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
     * ✅ ENHANCED: Better camera angle and composition
     */
    public buildGaragePrompt(
        params: UserFriendlyParams,
        selectedAddons?: any[]
    ): string {
        const width: number = params.width || 20;
        const length: number = params.length || 20;
        const height: number = params.height || 10;
        const roofType: string = params.roof_type || "regular";
        const color: string = params.color || "white";

        const colorDesc: string = this.getColorDescription(color);

        // Calculate door configuration
        const doorConfig = this.calculateDoorConfiguration(width, selectedAddons);

        // Log the configuration
        logger.info(`[PromptBuilder] Building configuration:`, {
            dimensions: `${width}×${length}×${height}ft`,
            aspectRatio: (width / length).toFixed(2),
            color: colorDesc,
            doors: doorConfig.totalDoors,
            roofType
        });

        // Determine roof description with more detail
        let roofDescription = "";
        let roofVisualDetail = "";
        const roofTypeLower = roofType.toLowerCase();

        if (roofTypeLower === 'box') {
            roofDescription = "flat box eave roof with horizontal ridge line";
            roofVisualDetail = "flat roofline with minimal pitch, horizontal eave trim";
        } else if (roofTypeLower === 'vertical') {
            roofDescription = "vertical roof with ridge panels running lengthwise";
            roofVisualDetail = "steep vertical roof panels with prominent ridge cap running front to back";
        } else if (roofTypeLower === 'gambrel') {
            roofDescription = "gambrel barn-style roof with dual slopes";
            roofVisualDetail = "distinctive barn-style gambrel roof with two slopes on each side";
        } else {
            roofDescription = "peaked gable roof with triangular end walls";
            roofVisualDetail = "traditional peaked gable roof with visible triangular end walls";
        }

        // Build addon specification with more detail
        let addonFeatures = "";
        if (selectedAddons && selectedAddons.length > 0) {
            const features = selectedAddons
                .filter(a => a && a.label)
                .map(a => {
                    const label = a.label.toLowerCase();
                    // Add visual descriptions for addons
                    if (label.includes('window')) return 'rectangular windows on side wall';
                    if (label.includes('walk-in')) return 'personnel entry door on side';
                    if (label.includes('cupola')) return 'decorative cupola on roof ridge';
                    return label;
                })
                .join(", ");
            addonFeatures = `Visible features: ${features}.`;
        }

        // Determine door description with positioning
        let doorDescription = "";
        let doorPositioning = "";
        if (doorConfig.totalDoors === 1) {
            doorDescription = "single centered roll-up garage door";
            doorPositioning = "one large centered door";
        } else if (doorConfig.totalDoors === 2) {
            doorDescription = "two side-by-side roll-up garage doors";
            doorPositioning = "two evenly-spaced doors on front facade";
        } else {
            doorDescription = `${doorConfig.totalDoors} side-by-side roll-up garage doors`;
            doorPositioning = `${doorConfig.totalDoors} evenly-spaced doors across front`;
        }

        // Calculate side visibility based on aspect ratio
        const aspectRatio = width / length;
        let sideVisibility = "";
        if (aspectRatio > 1.3) {
            sideVisibility = "wide building with prominent front facade, side wall partially visible";
        } else if (aspectRatio < 0.7) {
            sideVisibility = "deep building with substantial side wall visible, showing full length";
        } else {
            sideVisibility = "balanced proportions showing both front and side walls clearly";
        }

        /**
         * ✅ CRITICAL ENHANCEMENT: Better camera positioning and composition
         *
         * Key improvements:
         * 1. Specific camera angle (45-degree oblique view)
         * 2. Clear spatial description (front corner prominent)
         * 3. Emphasis on showing BOTH front and side
         * 4. Professional architectural photography style
         * 5. Better depth and dimension description
         */
        const prompt = `Professional architectural photograph of a ${colorDesc} corrugated metal building garage, shot from a 45-degree oblique angle showing the front corner, clearly displaying both the front facade with ${doorPositioning} AND the full side wall extending back, ${roofVisualDetail}, industrial steel construction with visible corrugated texture.

CAMERA COMPOSITION:
• Viewing angle: 45-degree oblique perspective from front corner
• Position: Eye-level exterior shot, standing back to capture full building
• Framing: Front facade on left side of frame, side wall extending to right, showing building depth and three-dimensional form
• Depth: Clear view of building's length and proportions, showing ${sideVisibility}

BUILDING SPECIFICATIONS:
• Physical dimensions: ${width} feet wide × ${length} feet deep × ${height} feet tall
• Building proportions: ${(width / length).toFixed(2)}:1 aspect ratio (${width > length ? 'wider than deep' : width < length ? 'deeper than wide' : 'square footprint'})
• Wall material: ${colorDesc} corrugated metal panels with vertical ribbing, crisp panel lines visible
• Roof style: ${roofDescription}, matching ${colorDesc} metal panels
• Roof detail: ${roofVisualDetail}
• Base: Concrete foundation with dark gray concrete stem wall, approximately 2-3 feet high
• Front doors: ${doorDescription}, all doors fully closed and sealed, white or tan horizontal roll-up sections with no gaps
${addonFeatures ? `• Additional features: ${addonFeatures}` : ''}

ENVIRONMENTAL SETTING:
• Ground: Natural dirt/gravel pad in foreground, grass or vegetation in background
• Sky: Clear blue sky with wispy clouds, natural daylight
• Surroundings: Rural or industrial setting, trees visible in distant background
• Lighting: Bright natural outdoor lighting, soft shadows showing building depth, no harsh contrasts

VISUAL STYLE:
Professional architectural photography, photorealistic rendering, sharp focus throughout, high detail showing metal texture, accurate building proportions matching ${(width / length).toFixed(2)}:1 ratio, three-dimensional depth clearly visible, realistic materials and weathering, HDRI lighting, 8K resolution quality.

CRITICAL COMPOSITION REQUIREMENTS:
• MUST show BOTH front wall (with doors) AND side wall (extending into depth)
• Camera positioned at front corner for maximum dimensional visibility
• Building oriented diagonally in frame to show depth
• Clear separation between front facade and receding side wall
• Proper perspective showing building extends backward from front doors
• Three-dimensional volume evident, not flat front-only view`;

        // ✅ ENHANCED: Stronger negative prompt specifically for flat compositions
        const negativeAdditions = `flat front-only view, straight-on frontal shot, no side wall visible, single-plane composition, flat elevation view, architectural elevation drawing, 2D front view, head-on perspective, symmetrical centered composition, no depth, no three-dimensional form, floating in space, no ground, open doors, ajar doors, partially open doors, door ajar, open garage door, lifted garage door, interior visible, interior view, dark interior, inside view, looking through doorway, people inside, vehicles inside, transparent doors, glass doors, windows in doors, bright interior lighting, interior space visible, gaping entrance, open access point, looking into building, wrong aspect ratio, distorted proportions, stretched dimensions, compressed dimensions, undersized, oversized, toy-like, miniature scale, blurry, low quality, poorly rendered, asymmetrical doors, crooked structure, warped panels, modern residential design, suburban house, residential garage door, people in scene, vehicles in foreground, cars visible, trucks visible, equipment in shot, signage, text, logos`;

        logger.info(`[PromptBuilder] Generated ENHANCED prompt with:`);
        logger.info(`  - Camera: 45-degree oblique angle from front corner`);
        logger.info(`  - Composition: Both front AND side walls visible`);
        logger.info(`  - Dimensions: ${width}×${length}×${height} (${(width/length).toFixed(2)}:1 ratio)`);
        logger.info(`  - Doors: ${doorConfig.totalDoors} (${doorConfig.fromAddons ? 'from addons' : 'calculated'})`);
        logger.info(`  - Visual emphasis: Three-dimensional depth and perspective`);
        logger.info(`  - Negative exclusions: ${negativeAdditions.split(',').length} terms`);

        // Store for later retrieval
        (this as any)._lastNegativePrompt = negativeAdditions;

        return prompt;
    }

    /**
     * ✅ Get the enhanced negative prompt for the last build
     */
    public getLastNegativePrompt(): string {
        return (this as any)._lastNegativePrompt || "flat view, no depth, open doors, interior visible, people, vehicles";
    }

    /**
     * ✅ Calculate door configuration once
     */
    private calculateDoorConfiguration(
        width: number,
        selectedAddons?: any[]
    ): { totalDoors: number; fromAddons: boolean } {

        // Check for addon doors first
        let addonDoorCount = 0;
        if (selectedAddons && Array.isArray(selectedAddons)) {
            selectedAddons.forEach(addon => {
                if (addon && addon.label && addon.label.toLowerCase().includes('door')) {
                    addonDoorCount++;
                }
            });
        }

        // If addons specify doors, use that count
        if (addonDoorCount > 0) {
            return { totalDoors: addonDoorCount, fromAddons: true };
        }

        // Calculate based on width (standard garage door widths)
        let garageDoorCount = 1;
        if (width >= 30) garageDoorCount = 2; // Two 9-10ft doors
        if (width >= 45) garageDoorCount = 3; // Three 9-10ft doors

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
