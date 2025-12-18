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
        const roofType: string = params.roof_type || "regular";
        const color: string = params.color || "white";
        const gauge: number = params.gauge || 16;

        const colorDesc: string = this.getColorDescription(color);

        // Calculate door configuration
        const doorConfig = this.calculateDoorConfiguration(width, selectedAddons);

        logger.info(`[PromptBuilder] Building INDUSTRIAL GARAGE configuration:`, {
            dimensions: `${width}×${length}×${height}ft`,
            aspectRatio: (width / length).toFixed(2),
            color: colorDesc,
            doors: doorConfig.totalDoors,
            roofType,
            gauge
        });

        // Determine roof description - industrial focus
        let roofDescription = "";
        let roofVisualDetail = "";
        const roofTypeLower = roofType.toLowerCase();

        if (roofTypeLower === 'box') {
            roofDescription = "flat box eave industrial roof with steel frame";
            roofVisualDetail = "flat roofline with horizontal trim, steel structural supports visible at eaves";
        } else if (roofTypeLower === 'vertical') {
            roofDescription = "vertical corrugated roof panels with ridge cap";
            roofVisualDetail = "steep vertical corrugated panels with prominent industrial ridge running front to back, metal seams visible";
        } else if (roofTypeLower === 'gambrel') {
            roofDescription = "gambrel industrial roof with dual slopes";
            roofVisualDetail = "industrial gambrel roof with two distinct slopes on each side, metal cladding throughout";
        } else {
            roofDescription = "peaked gable industrial roof with corrugated panels";
            roofVisualDetail = "traditional peaked gable roof with corrugated metal panels, triangular end wall gable";
        }

        // Build addon specification
        let addonFeatures = "";
        if (selectedAddons && selectedAddons.length > 0) {
            const features = selectedAddons
                .filter(a => a && a.label)
                .map(a => {
                    const label = a.label.toLowerCase();
                    if (label.includes('window')) return 'industrial metal-frame windows on side wall';
                    if (label.includes('walk-in')) return 'industrial steel personnel entry door on side';
                    if (label.includes('cupola')) return 'metal cupola vent on roof ridge';
                    return label;
                })
                .join(", ");
            addonFeatures = `Industrial features: ${features}.`;
        }

        // Door description - industrial garage doors
        let doorDescription = "";
        let doorPositioning = "";
        if (doorConfig.totalDoors === 1) {
            doorDescription = "single large industrial roll-up garage door, sectional metal construction";
            doorPositioning = "one centered heavy-duty garage door";
        } else if (doorConfig.totalDoors === 2) {
            doorDescription = "two side-by-side heavy-duty industrial roll-up garage doors, sectional construction";
            doorPositioning = "two evenly-spaced industrial garage doors on front";
        } else {
            doorDescription = `${doorConfig.totalDoors} side-by-side heavy-duty industrial roll-up garage doors`;
            doorPositioning = `${doorConfig.totalDoors} evenly-spaced industrial doors across front`;
        }

        const aspectRatio = width / length;
        let sideVisibility = "";
        if (aspectRatio > 1.3) {
            sideVisibility = "wide commercial building with prominent corrugated front facade, deep side wall receding";
        } else if (aspectRatio < 0.7) {
            sideVisibility = "deep commercial building with substantial corrugated side wall, full length visible";
        } else {
            sideVisibility = "balanced industrial proportions showing both corrugated front and side walls";
        }

        /**
         * ✅ CRITICAL: Industrial corrugated metal garage - NOT residential
         *
         * Key specifications:
         * 1. Corrugated metal construction emphasized throughout
         * 2. Industrial/commercial style - NOT residential house
         * 3. Heavy-duty garage doors
         * 4. Metal panels with visible ribbing
         * 5. 45-degree oblique viewing angle
         * 6. Concrete pad/foundation
         * 7. No windows (unless addon)
         * 8. Stark industrial aesthetic
         */
        const prompt = `Professional architectural photograph of an industrial corrugated metal storage building and commercial garage structure, ${colorDesc} color, shot from a 45-degree oblique angle.

BUILDING TYPE & STYLE:
• Type: Commercial warehouse garage, NOT a residential home
• Construction: Steel frame with corrugated metal panel infill, industrial grade
• Frame: Visible steel structural braces, columns, and frame members painted dark color (black, dark gray, or dark brown)
• Infill Material: Gauge ${gauge} corrugated metal panels filling between steel frame braces
• Style: Industrial utilitarian design with exposed frame structure, functional aesthetic, commercial/agricultural/industrial use
• Purpose: Heavy equipment storage, vehicle maintenance garage, commercial workshop

CORRUGATED METAL & FRAME SPECIFICATIONS:
• Steel frame: Dark colored structural steel braces, columns, and frame members (black, dark gray, or dark brown paint)
• Frame visibility: Visible structural frame creating grid pattern on building exterior
• Metal panels: ${colorDesc} corrugated metal infill panels filling between frame braces
• Panel material: Gauge ${gauge} corrugated steel with vertical ribbing, professional industrial finish
• Metal ribs: Clearly visible corrugated texture, 1-1.5 inch depth showing 3D dimension
• Frame-to-panel: Strong contrast between dark steel frame and ${colorDesc} metal infill
• Structural appearance: Frame braces visible at corners, across walls, and at roof line
• Professional installation: Clean panel seams, frame bolts visible, industrial construction quality

ROOF STYLE:
• Roof type: ${roofDescription}
• Roof detail: ${roofVisualDetail}
• Overhang: 12-18 inch industrial eaves overhang with metal fascia trim
• Ridge: Metal ridge cap running full length, properly sealed

FRONT FACADE:
• Doors: ${doorDescription}
• Door placement: ${doorPositioning}
• Door type: Heavy-duty industrial sectional roll-up garage doors, fully closed
• Door material: Steel construction with horizontal sections, industrial white/cream sections with dark metal frames
• Door frame: Heavy steel frame with visible hardware, professional installation, dark frame contrasts with door panels
• Frame braces: Visible dark steel structural braces framing the door opening
• Wall composition: Dark steel frame with ${colorDesc} corrugated metal infill panels on either side of door
• No windows on front facade (industrial/utilitarian)
• Foundation: Dark concrete stem wall 2-3 feet visible, concrete pad extends forward

SIDE WALL:
• Material: Corrugated metal matching front, ${colorDesc} color
• Visibility: Full side wall visible, extending back showing building depth
• Windows: ${selectedAddons?.some(a => a.label.toLowerCase().includes('window')) ? 'Industrial metal-frame windows visible on side' : 'No windows (industrial warehouse style)'}
• Composition: ${sideVisibility}

GROUND & FOUNDATION:
• Base: Concrete pad foundation, light gray concrete color
• Ground surface: Industrial gravel or dirt lot in foreground
• Foreground: Gravel/dirt pad area, clear view of building base
• Ground texture: Industrial warehouse setting, no landscaping

ENVIRONMENTAL SETTING:
• Setting: Industrial/agricultural rural area, isolated commercial building
• Sky: Clear blue sky, natural outdoor lighting
• Surroundings: Open landscape, minimal vegetation, industrial perimeter
• Lighting: Bright natural daylight, side lighting showing corrugated texture detail
• Shadows: Soft shadows emphasizing corrugated metal 3D texture

CAMERA & COMPOSITION:
• Viewing angle: 45-degree oblique oblique perspective from front corner
• Position: Eye-level exterior shot, standing at natural distance
• Framing: Front facade with doors on left-center, side wall extending to right, depth clearly visible
• Orientation: Front corner prominent, building oriented diagonally showing three-dimensional form
• Perspective: Professional architectural documentation style
• Depth: Clear building length and proportions visible, not flat view

VISUAL SPECIFICATIONS:
• Style: Photorealistic architectural rendering of industrial building
• Quality: Sharp focus, high detail, 8K resolution
• Texture: Clear corrugated metal ribs, panel lines, seams, weathering, industrial finish
• Color accuracy: Accurate ${colorDesc} color rendering
• Proportions: Physical dimensions ${width}ft wide × ${length}ft deep × ${height}ft tall (${(width/length).toFixed(2)}:1 ratio)
• Lighting: HDRI industrial lighting, harsh shadows showing texture
• Style: Documentary architectural photography, NO artistic filters

${addonFeatures ? `ADDITIONAL FEATURES: ${addonFeatures}` : ''}

CRITICAL REQUIREMENTS:
✓ MUST have visible dark steel frame/braces with corrugated metal infill panels
✓ MUST show structural steel frame creating grid pattern on exterior
✓ MUST have clear contrast between dark frame and ${colorDesc} panel color
✓ MUST show corrugated metal texture with visible ribbing in infill panels
✓ MUST show both front (with garage doors) AND side wall in 3D perspective
✓ MUST show concrete foundation/stem wall
✓ MUST show industrial warehouse/commercial aesthetic with frame structure
✓ MUST have heavy-duty garage doors, fully sealed/closed
✓ MUST display 45-degree oblique angle with building depth clearly visible
✓ MUST NOT look like house, residential garage, or dwelling
✓ Frame style: Visible structural braces, NOT solid wall
✓ Dimensions: ${width}×${length}×${height} feet (${(width/length).toFixed(2)}:1 aspect ratio)`;

        /**
         * ✅ CRITICAL NEGATIVE PROMPT: Prevent residential/home-like appearance
         */
        const negativePrompt = `residential home, house, dwelling, family home, residential garage, suburban house, residential structure, architectural home design, living space, bedroom, kitchen, windows with curtains, roof peak with eaves overhang, dormer windows, shutters, porch, deck, deck steps, residential entry door, residential siding, wood siding, brick wall, brick facade, vinyl siding, stone facade, landscaping, flower beds, shrubs, hedges, manicured lawn, driveway asphalt, residential appearance, modern house, colonial house, ranch house, beautiful home, cozy home, elegant home, luxury home, mansion, cottage, modern residential, flat front-only view, head-on frontal shot, no side wall, single-plane 2D view, architectural elevation, no depth, floating in space, no ground, open garage door, lifted door, interior visible, inside view, people inside, vehicles inside, occupants, glass door, transparent door, bright interior, interior lighting, open entrance, gaping opening, wrong dimensions, distorted proportions, stretched, compressed, asymmetrical, crooked, warped, blurry, low quality, poorly rendered, toy-like, miniature, cartoon, stylized, artistic, filtered, Instagram filter, painted, drawing, sketch, watercolor, illustration, digital art, CGI obvious, rendering artifacts, modern residential design, people in scene, humans visible, vehicles in shot, cars, trucks, equipment, signage, text, logos, branding`;

        logger.info(`[PromptBuilder] Generated INDUSTRIAL GARAGE prompt with:`);
        logger.info(`  - Material: ${gauge} gauge corrugated metal (EMPHASIZED)`);
        logger.info(`  - Style: Industrial warehouse, NOT residential`);
        logger.info(`  - Doors: ${doorConfig.totalDoors} heavy-duty garage doors`);
        logger.info(`  - Dimensions: ${width}×${length}×${height} (${(width/length).toFixed(2)}:1)`);
        logger.info(`  - Angle: 45-degree oblique showing depth`);
        logger.info(`  - Negative: ${negativePrompt.split(',').length} exclusion terms`);

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
