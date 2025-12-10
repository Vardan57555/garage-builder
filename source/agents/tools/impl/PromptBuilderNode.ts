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
            "Barn Red": "barn red",
            "Burgundy": "burgundy",
            "Royal Blue": "royal blue",
            "Evergreen": "evergreen",
            "Pewter Gray": "pewter gray",
            "White": "white",
            "Black": "black",
            "Clay": "clay brown",
            "Pebble Beige": "pebble beige",
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
     * ✅ FIXED: Simplified and more effective prompt
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

        // Calculate door configuration ONCE
        const doorConfig = this.calculateDoorConfiguration(width, selectedAddons);

        // Log the configuration
        logger.info(`[PromptBuilder] Building configuration:`, {
            dimensions: `${width}×${length}×${height}ft`,
            aspectRatio: (width / length).toFixed(2),
            color: colorDesc,
            doors: doorConfig.totalDoors,
            roofType
        });

        let roofDescription = "";
        const roofTypeLower = roofType.toLowerCase();

        if (roofTypeLower === 'box') {
            roofDescription = "flat box eave roof";
        } else if (roofTypeLower === 'vertical') {
            roofDescription = "vertical roof panels";
        } else if (roofTypeLower === 'gambrel') {
            roofDescription = "gambrel barn-style roof";
        } else {
            roofDescription = "peaked gable roof";
        }

        // Build addon specification
        let addonSpec = "";
        if (selectedAddons && selectedAddons.length > 0) {
            const addonList = selectedAddons
                .filter(a => a && a.label)
                .map(a => a.label)
                .join(", ");
            addonSpec = `Additional features: ${addonList}.`;
        }

        // ✅ SIMPLIFIED PROMPT - More focused, less contradictory
        return `A ${colorDesc} colored corrugated metal building garage, exterior view, closed roll-up garage doors, ${roofDescription}, industrial metal construction.

Building dimensions: ${width} feet wide × ${length} feet long × ${height} feet tall.
The building has ${doorConfig.totalDoors} closed roll-up garage door${doorConfig.totalDoors > 1 ? 's' : ''} on the front.

Color: All walls and roof are ${colorDesc} corrugated metal panels.
Roof: ${roofDescription} with ${colorDesc} metal panels.
Doors: ${doorConfig.totalDoors} closed white or tan roll-up garage doors with horizontal panel lines.
${addonSpec}

Style: Industrial metal building, corrugated steel texture, closed doors, outdoor setting with grass, 3/4 angle view showing front and one side, professional architectural photography, natural lighting.

Important: Building aspect ratio is ${(width / length).toFixed(2)}:1 (width to length). ${width > length ? 'Wide building' : width < length ? 'Long building' : 'Square building'}.

Negative prompt: open doors, interior visible, glass windows, modern design, residential style, people, vehicles, wrong proportions, distorted scale`;
    }

    /**
     * ✅ NEW: Calculate door configuration once
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

        // Otherwise calculate based on width
        let garageDoorCount = 1;
        if (width >= 30) garageDoorCount = 2;
        if (width >= 45) garageDoorCount = 3;

        return { totalDoors: garageDoorCount, fromAddons: false };
    }

    /**
     * ✅ REMOVED: generateDoorWindowConfig - now handled in calculateDoorConfiguration
     */

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
