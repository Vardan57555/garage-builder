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

        // ✅ ROOF TYPE DESCRIPTION - CRITICAL FIX FOR GARAGE
        let roofDescription = "";
        const roofTypeLower = roofType ? roofType.toLowerCase() : "regular";

        if (roofTypeLower === 'box') {
            roofDescription = "flat box-style roof with minimal overhang";
        } else if (roofTypeLower === 'vertical') {
            roofDescription = "vertical ribbed metal roof panels";
        } else if (roofTypeLower === 'gambrel') {
            roofDescription = "gambrel curved barn-style roof";
        } else if (roofTypeLower === 'monoslope') {
            roofDescription = "single-slope angled roof design";
        } else {
            roofDescription = "peaked gable roof design";
        }

        // ✅ Build addon specification
        let addonSpec = "";
        if (selectedAddons && selectedAddons.length > 0) {
            const addonCounts: { [key: string]: number } = {};
            selectedAddons.forEach(addon => {
                if (addon && addon.label) {
                    addonCounts[addon.label] = (addonCounts[addon.label] || 0) + 1;
                }
            });

            addonSpec = `\n\nADDON FEATURES (MUST BE INCLUDED):
${Object.entries(addonCounts)
                .map(([label, count]) => `- ${count} × ${label}`)
                .join("\n")}

These addons MUST be visible in the rendering. Do not add extra addons beyond what is specified.`;

            logger.info(`[PromptBuilder] Addons included:`, addonCounts);
        }

        // ✅ CRITICAL: VERY EXPLICIT about dimensions
        return `Professional photorealistic exterior architectural visualization of a METAL GARAGE BUILDING.

⚠️ THIS IS A GARAGE - NOT A HOUSE - NOT RESIDENTIAL ⚠️

EXACT SPECIFICATIONS - MUST MATCH THESE EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DIMENSIONS (CRITICAL - MATCH EXACTLY):
⚠️ WIDTH: ${width} feet (front opening width)
⚠️ LENGTH: ${length} feet (side-to-side depth)  
⚠️ HEIGHT: ${height} feet (floor to roof peak)

This garage is ${width}ft WIDE × ${length}ft LONG × ${height}ft TALL
Render it with ACCURATE PROPORTIONS matching these dimensions
If dimensions are unusual (e.g., 20×20×10), render the actual proportions - do NOT default to typical garage size

BUILDING FEATURES:
⚠️ Building Type: METAL GARAGE (industrial, NOT residential house)
⚠️ Roof Style: ${roofType} roof (${roofDescription})
⚠️ Metal Gauge: ${gauge}
⚠️ Color: ${colorDesc}${addonSpec}

DOOR & WINDOW CONFIGURATION:
${this.generateDoorWindowConfig(width, length, selectedAddons)}

CRITICAL ARCHITECTURAL REQUIREMENTS:
- Building MUST be a GARAGE structure with GARAGE DOORS (roll-up metal doors)
- Building MUST be ${width}ft wide × ${length}ft long × ${height}ft tall (NOT default size)
- Roof proportions MUST match the ${height}ft height (NOT oversized)
- Door and window sizes MUST be realistic for a ${width}×${length}ft building
- Foundation pad MUST exactly match the ${width}×${length}ft footprint
- NO EXTRA features beyond what's specified above
- ${colorDesc} metal siding on all walls and roof
- ${roofType} roof in ${colorDesc}
- Concrete foundation pad (${width}ft × ${length}ft)
- Industrial metal garage appearance - NOT residential house

VISUAL ELEMENTS:
- Outdoor setting with landscaping
- Green lawn and trees in background
- Professional, industrial appearance
- Clean, well-maintained metal construction
- Metal corrugation visible on panels

LIGHTING & PERSPECTIVE:
- Golden hour lighting (warm, professional)
- Clear blue sky with subtle clouds
- 3/4 front corner architectural view
- Camera positioned to clearly show all dimensions
- Perspective must make the ${width}×${length}×${height} proportions obvious

QUALITY REQUIREMENTS:
- Professional architectural visualization style
- 8k resolution, sharp focus, detailed textures
- Accurate ${colorDesc} color rendering
- Realistic ${gauge} metal appearance and weathering
- Premium, professional appearance

STRICT CONSTRAINTS - DO NOT VIOLATE:
✓ Building is GARAGE - NOT HOUSE - NOT RESIDENTIAL
✓ Building is ${width}ft × ${length}ft × ${height}ft - render at EXACT scale
✓ Roof style is ${roofType} (${roofDescription})
✓ Roll-up metal garage doors (NOT residential doors)
✓ No extra features beyond: garage doors, windows, and specified addons
✓ NO generic/template designs - use ACTUAL dimensions
✓ Color is ${colorDesc} - match precisely
✓ Metal gauge is ${gauge} - render appropriate thickness/appearance
✓ Addons included: ${selectedAddons?.length > 0 ? selectedAddons.map(a => a.label).join(', ') : 'None'}
✓ Industrial metal construction - NOT residential

EXCLUDE:
✗ People, text, watermarks, signs
✗ Random vehicles
✗ House features (windows with residential trim, shutters, porches)
✗ Living space indicators
✗ Typical residential design

FINAL CONFIRMATION: This is a ${width}×${length}×${height}ft METAL GARAGE with ${roofType} roof and ${colorDesc} color. Render as GARAGE, NOT as house.`;
    }

    /**
     * ✅ Generate door/window config based on actual dimensions
     */
    private generateDoorWindowConfig(width: number, length: number, selectedAddons?: any[]): string {
        try {
            // Calculate appropriate number of garage doors based on width
            let garageDoors = 1;
            if (width >= 30) garageDoors = 2;
            if (width >= 45) garageDoors = 3;

            let addonDoors = 0;
            let addonWindows = 0;

            // Safely count addon doors and windows
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

            // If user specified doors/windows in addons, use those numbers
            const totalDoors = addonDoors > 0 ? addonDoors : garageDoors;
            const totalWindows = Math.max(addonWindows, 2); // At least 2 small windows for ventilation

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
            // ... rest of unified prompt
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
