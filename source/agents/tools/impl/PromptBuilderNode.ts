import {InstantiationError} from "@errors/InstantiationError";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {IPromptBuilder} from "@agents/tools/impl/io/IVisualizationNode";
import {DimensionResult, ExtractionContext} from "@agents/tools/io/IParameterExtraction";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

/**
 * Builds detailed garage prompts from parameters
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
            "Barn Red": "barn red, deep red metal panels",
            "Burgundy": "burgundy, dark red wine color",
            "Royal Blue": "royal blue, bright blue",
            "Evergreen": "evergreen, dark forest green",
            "Pewter Gray": "pewter gray, medium gray metallic",
            "White": "white, clean white",
            "Black": "black, matte black",
            "Clay": "clay brown, tan earth tone",
            "Pebble Beige": "pebble beige, light tan",
            "Earth Brown": "earth brown, rich brown",
        };
    }


    /**
     * Gets the singleton instance of StateReset.
     *
     * @returns The singleton instance of StateReset.
     */

    public static getInstance(): IPromptBuilder
    {
        if(!PromptBuilder.instance)
        {
            PromptBuilder.instance = new PromptBuilder(Enforce);
        }

        return PromptBuilder.instance;
    }

    /**
     * Get a color description or fallback to the lowercase color name
     */

    private getColorDescription(color: string): string
    {
        return this.colorDescriptions[color] || color.toLowerCase();
    }

    /**
     * Build detailed garage prompt from parameters
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
        const gauge: string = params.gauge ? `${params.gauge}GA` : "16GA";

        logger.info(`[PromptBuilder] Building garage prompt with EXACT specs:`, {
            width, length, height, roofType, color, gauge,
            addons: selectedAddons?.length || 0
        });

        const colorDesc: string = this.getColorDescription(color);

        let roofDescription = "";
        const roofTypeLower = roofType ? roofType.toLowerCase() : "regular";

        if (roofTypeLower === 'box')
        {
            roofDescription = "flat horizontal box eave roof with minimal overhang";
        }
        else if (roofTypeLower === 'vertical')
        {
            roofDescription = "vertical ribbed metal roof with ridge running length of building";
        }
        else if (roofTypeLower === 'gambrel')
        {
            roofDescription = "gambrel curved barn-style roof";
        }
        else
        {
            roofDescription = "peaked A-frame gable roof with metal ridge cap";
        }

        const doorWindowConfig = this.generateDoorWindowConfig(width, length, selectedAddons);

        let garageDoorCount = 1;
        if (width >= 30) garageDoorCount = 2;
        if (width >= 45) garageDoorCount = 3;

        let addonDoorCount = 0;
        if (selectedAddons && Array.isArray(selectedAddons)) {
            selectedAddons.forEach(addon => {
                if (addon && addon.label && addon.label.toLowerCase().includes('door')) {
                    addonDoorCount++;
                }
            });
        }
        const totalDoors = addonDoorCount > 0 ? addonDoorCount : garageDoorCount;

        let addonSpec = "";
        if (selectedAddons && selectedAddons.length > 0) {
            const addonList = selectedAddons
                .filter(a => a && a.label)
                .map(a => `- ${a.label}`)
                .join("\n");

            addonSpec = `

ADDITIONAL FEATURES (include these):
${addonList}`;

            logger.info(`[PromptBuilder] Addons:`, selectedAddons.map(a => a.label));
        }

        return `INDUSTRIAL COMMERCIAL METAL BUILDING - STEEL GARAGE STRUCTURE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL: THIS IS A COMMERCIAL STEEL GARAGE BUILDING
⚠️ NOT A RESIDENTIAL HOUSE - NOT A HOME - NOT WOOD SIDING
⚠️ THIS IS AN ALL-METAL INDUSTRIAL GARAGE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUILDING SPECIFICATIONS:
━━━━━━━━━━━━━━━━━━━━
Type: PRE-ENGINEERED METAL BUILDING (COMMERCIAL GARAGE)
Width: ${width} feet (front face with doors)
Length: ${length} feet (side depth)
Height: ${height} feet (eave height to roof peak)
Proportions: ${width}ft × ${length}ft × ${height}ft

CONSTRUCTION MATERIALS:
━━━━━━━━━━━━━━━━━━━━
⚠️ ALL-METAL CONSTRUCTION - NO WOOD, NO RESIDENTIAL MATERIALS
- ${colorDesc} corrugated steel panels on ALL walls
- ${colorDesc} metal roof panels (${roofType} style: ${roofDescription})
- ${gauge} steel gauge thickness
- Vertical or horizontal metal ribbing visible on panels
- Metal ridge caps and trim pieces
- Exposed metal fasteners/screws visible
- Industrial steel beam framework (visible at corners)
- Concrete slab foundation (${width}ft × ${length}ft pad)

DOOR CONFIGURATION:
━━━━━━━━━━━━━━━━━
⚠️ ROLL-UP STEEL GARAGE DOORS (NOT GLASS DOORS, NOT RESIDENTIAL DOORS)
${doorWindowConfig}
- White or almond colored door panels
- Black or dark metal door tracks on sides
- Industrial garage door hardware visible
- Each door approximately 9-10ft wide × 8-10ft tall
- Metal door frames and trim in dark color${addonSpec}

WINDOWS (OPTIONAL):
- 2-4 small rectangular windows for ventilation (if any)
- Simple metal-framed windows, industrial style
- NO residential-style windows with shutters or trim

ROOF DETAILS:
━━━━━━━━━━━
- ${roofType} roof style: ${roofDescription}
- ${colorDesc} metal roof panels matching wall color
- Metal ridge cap at roof peak
- Minimal roof overhang (6-12 inches)
- Gutters and downspouts (same color as building)
- Clean industrial appearance

VISUAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━
⚠️ INDUSTRIAL METAL BUILDING AESTHETIC - NOT RESIDENTIAL
- Clean, professional commercial garage appearance
- All surfaces: corrugated steel panels in ${colorDesc}
- Visible metal ribbing/corrugation texture
- Simple rectangular box shape with ${roofType} roof
- NO decorative elements, NO residential features
- NO wood siding, NO stone accents, NO shutters
- Industrial utilitarian design
- Professional metal building manufacturer quality

SETTING & ENVIRONMENT:
━━━━━━━━━━━━━━━━━━
- Outdoor setting with green lawn
- Trees or vegetation in background
- Concrete foundation pad visible (${width}ft × ${length}ft)
- Gravel or grass around building perimeter
- Clear blue sky
- Golden hour lighting (warm, professional)

CAMERA & COMPOSITION:
━━━━━━━━━━━━━━━━━━
- 3/4 corner view showing front and one side
- Eye-level perspective (6ft camera height)
- Wide angle showing full building
- Professional architectural photography style
- Sharp focus, high detail
- Building fills 70-80% of frame

QUALITY STANDARDS:
━━━━━━━━━━━━━━
- 8K photorealistic rendering
- Sharp metal texture detail
- Accurate ${colorDesc} color representation
- Professional commercial building appearance
- Industrial-grade quality visualization
- Realistic ${gauge} steel gauge appearance

STRICT CONSTRAINTS - MUST FOLLOW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL-METAL construction (steel panels, metal roof)
✅ INDUSTRIAL GARAGE appearance (NOT residential house)
✅ ROLL-UP GARAGE DOORS (NOT glass doors, NOT residential entry doors)
✅ ${colorDesc} color on ALL surfaces (walls + roof)
✅ ${roofType} roof style: ${roofDescription}
✅ ${width}×${length}×${height}ft dimensions EXACTLY
✅ Simple rectangular metal building shape
✅ Commercial/industrial aesthetic (NOT decorative/residential)
✅ Corrugated steel panel texture visible
✅ ${gauge} metal gauge appropriate appearance
✅ Concrete foundation pad ${width}×${length}ft

ABSOLUTELY FORBIDDEN - DO NOT INCLUDE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NO residential house features (porches, columns, decorative trim)
❌ NO wood siding or natural wood materials
❌ NO stone or brick accents
❌ NO glass entry doors or French doors
❌ NO residential windows with shutters or decorative frames
❌ NO landscaping attached to building (planters, flower boxes)
❌ NO people, vehicles, text, or watermarks
❌ NO residential architectural style
❌ NO large overhangs or decorative roof features
❌ NO complex architectural details

BUILDING CATEGORY: PRE-ENGINEERED METAL BUILDING (PEMB)
INDUSTRY: Commercial steel garage structures
MANUFACTURER STYLE: Metal building company (Mueller, General Steel, etc.)
APPEARANCE: Industrial, utilitarian, functional metal garage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL CONFIRMATION:
This is a ${width}×${length}×${height}ft ALL-METAL INDUSTRIAL GARAGE
Color: ${colorDesc} steel panels
Roof: ${roofType} style metal roof
Doors: ${totalDoors} roll-up steel garage doors
Appearance: COMMERCIAL METAL BUILDING - NOT RESIDENTIAL HOUSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }

    /**
     * Get a color description or fallback to the lowercase color name
     */

    /**
     * ✅ Generate door/window config based on actual dimensions
     */
    private generateDoorWindowConfig(width: number, length: number, selectedAddons?: any[]): string {
        try {
            let garageDoors = 1;
            if (width >= 30) garageDoors = 2;
            if (width >= 45) garageDoors = 3;

            let addonDoors = 0;
            let addonWindows = 0;

            if (selectedAddons && Array.isArray(selectedAddons)) {
                selectedAddons.forEach(addon => {
                    if (addon && addon.label) {
                        const labelLower = addon.label.toLowerCase();
                        if (labelLower.includes('door')) {
                            addonDoors++;
                        }
                        if (labelLower.includes('window')) {
                            addonWindows++;
                        }
                    }
                });
            }

            const totalDoors = addonDoors > 0 ? addonDoors : garageDoors;
            const totalWindows = Math.max(addonWindows, 2);

            logger.info(`[PromptBuilder] Door/Window config:`, {
                garageDoors: totalDoors,
                windows: totalWindows,
                addonDoors,
                addonWindows
            });

            return `- ${totalDoors} × roll-up metal garage door(s) with horizontal panel lines
- ${totalWindows} × small ventilation window(s) near roof
- Dark metal trim around all doors and windows
- Simple industrial appearance (NO residential door on side)`;
        } catch (error) {
            logger.error("[PromptBuilder] Error in door/window config:", error);
            return `- 1 × roll-up metal garage door with horizontal panel lines
- 2 × small ventilation window(s) near roof
- Dark metal trim around all doors and windows`;
        }
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
