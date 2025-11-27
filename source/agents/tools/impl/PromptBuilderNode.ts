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

    private readonly dimensionFormulas = {
        width: (numCars: number) => `(${numCars} × 6) + 8 = ${numCars * 6 + 8} ft`,
        length: "15 + 5 = 20 ft",
        height: "10 or 12 feet",
    };

    private readonly indecisionKeywords: string[] = [
        "any",
        "whatever",
        "i don't know",
        "idk",
        "doesn't matter",
        "anything",
        "surprise me",
        "you pick",
        "no preference",
        "doesn't care",
        "pick one",
        "don't care",
    ];

    private readonly validValues = {
        roof_type: ["vertical", "regular", "box", "a-frame"],
        gauge: [14, 16, 18, 20],
        building_type: ["garage", "shed", "barn"],
    };

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
    public buildGaragePrompt(params: UserFriendlyParams): string
    {
        // ✅ CRITICAL FIX: Use all params with proper fallbacks
        const width: number = params.width || 20;
        const length: number = params.length || 20;
        const height: number = params.height || 10;
        const roofType: string = params.roof_type || "gable";
        const color: string = params.color || "gray";
        const gauge: string = params.gauge ? `${params.gauge}GA` : "16GA";

        logger.info(`[PromptBuilder] Building garage prompt with:`, {
            width, length, height, roofType, color, gauge
        });

        const colorDesc: string = this.getColorDescription(color);

        return `Professional photorealistic exterior architectural visualization of a metal garage building.

Dimensions: ${width} feet wide by ${length} feet long by ${height} feet tall.
Roof style: ${roofType} roof with clean modern lines.
Metal gauge: ${gauge} - professional commercial grade materials.

COLOR: ${colorDesc} metal siding and roof panels - this is the PRIMARY color of the entire building.

Features:
- Metal roll-up garage doors with windows and modern handles
- Professional ${colorDesc} corrugated metal panels covering entire building
- ${colorDesc} metal siding on all walls
- ${colorDesc} metal roof panels
- Concrete foundation pad
- Suburban residential setting with landscaping
- Green lawn and trees in background

Lighting: Golden hour lighting, warm and professional, clear blue sky with subtle clouds.
Perspective: 3/4 front corner architectural view showing the ${colorDesc} metal exterior
Quality: Professional real estate photography, 8k, sharp focus, detailed textures, accurate ${colorDesc} color rendering
Realistic materials, accurate proportions, professional rendering.

IMPORTANT: The building must be ${colorDesc} - make this color prominent and realistic.
The ${width}x${length}x${height} dimensions should be proportional and accurate.
The ${roofType} roof style should be clearly visible and realistic.
Use ${gauge} metal gauge appearance - professional and durable looking.

Exclude: people, text, watermarks, signs, vehicles`;
    }

    public buildUnifiedPrompt(context: ExtractionContext, calculation: DimensionResult): string
    {
        const sections: string[] = [
            this.buildSystemPrompt(),
            this.buildDimensionSection(calculation),
            this.buildFieldContextSection(context.currentField),
            this.buildLockedFieldsSection(context.currentParams),
            this.buildRulesSection(context.currentField),
            this.buildExamplesSection(),
            `User input: "${context.userInput}"`,
        ];

        return sections.filter(Boolean).join("\n");
    }

    private buildSystemPrompt(): string {
        return `You are a building parameter extraction system.

CRITICAL: Return ONLY valid JSON. NO explanations, NO code.`;
    }

    private buildDimensionSection(calc: DimensionResult): string {
        let section = `
DIMENSION CALCULATION (Dynamic Formula):
- Width formula: (number_of_cars × 6) + 8 feet clearance
- Length formula: 15 (car length) + 5 feet clearance = 20 feet
- Height: 10 feet (standard) or 12 feet (truck/RV)`;

        if (calc.numCars) {
            section += `

Example for ${calc.numCars} car(s):
- Width: ${this.dimensionFormulas.width(calc.numCars)}
- Length: ${this.dimensionFormulas.length}
- Height: ${this.dimensionFormulas.height}`;
        }

        return section;
    }

    private buildFieldContextSection(currentField?: string): string {
        if (!currentField) return "";

        return `
⚠️ CRITICAL: User is ONLY being asked for: "${currentField}"

SPECIAL HANDLING FOR INDECISIVE RESPONSES:
If user says ANY of these: ${this.indecisionKeywords.join(", ")}
→ Select a BALANCED/DEFAULT option for that field:
${this.buildDefaultsText()}

RULES:
- Extract ONLY ${currentField} from their response
- DO NOT extract other fields
- If answer is indecisive/vague, return the default instead of asking again
${this.buildFieldSpecificRules(currentField)}`;
    }

    private buildDefaultsText(): string {
        return `  - For roof_type: Select "regular" (most balanced option - middle choice)
  - For gauge: Select "16" (most common gauge in industry)
  - For building_type: Select "garage" (most common type)`;
    }

    private buildFieldSpecificRules(field: string): string {
        const rules: Record<string, string> = {
            gauge: `- Valid gauge values ONLY: ${this.validValues.gauge.join(", ")}. If user says "any/idk/whatever", return: 16`,
            roof_type: `- Valid roof types ONLY: ${this.validValues.roof_type.join(", ")}. If user says "any/idk/whatever", return: regular`,
            building_type: `- Valid types: ${this.validValues.building_type.join(", ")}. If user says "any/idk/whatever", return: garage`,
        };

        return rules[field] || "";
    }

    private buildLockedFieldsSection(currentParams: Record<string, any>): string {
        const lockedFields = this.getLockedFields(currentParams);

        if (lockedFields.length === 0) return "";

        return `
🔒 LOCKED FIELDS (DO NOT INCLUDE IN OUTPUT):
- ${lockedFields.join(", ")}

ONLY extract the current field, OMIT locked fields entirely`;
    }

    private buildRulesSection(currentField?: string): string {
        return `
EXTRACTION RULES:
1. Car count: "2 cars" → {"garage_type": "2-car"}
2. Roof types: ONLY ${this.validValues.roof_type.join(", ")}
   - If user says "any"/"whatever"/etc → {"roof_type": "regular"} (balanced default)
3. Gauge: ONLY ${this.validValues.gauge.join(", ")}
   - If user says "any"/"whatever"/etc → {"gauge": 16} (most common)
4. States: "Texas", "California", etc.
5. Building type: ${this.validValues.building_type.join(", ")}`;
    }

    private buildExamplesSection(): string {
        return `
EXAMPLES OF INDECISION HANDLING:
- User says "any" for roof → {"roof_type": "regular"}
- User says "whatever" for gauge → {"gauge": 16}
- User says "idk" for gauge → {"gauge": 16}
- User says "doesn't matter" for gauge → {"gauge": 16}
- User says "idk" for building type → {"building_type": "garage"}
- User says "surprise me" for roof → {"roof_type": "regular"}
- User says "don't care" for gauge → {"gauge": 16}
- User says "pick one" for roof → {"roof_type": "regular"}

NORMAL EXAMPLES:
- Input: "5 car garage" → Output: {"garage_type": "5-car", "width": 38, "length": 20, "height": 10}
- Input: "vertical roof" → Output: {"roof_type": "vertical"}
- Input: "Texas" with current field "state_name" → Output: {"state_name": "Texas"}
- Input: "14GA" with current field "gauge" → Output: {"gauge": 14}

OUTPUT: ONLY valid JSON, nothing else`;
    }

    private getLockedFields(params: Record<string, any>): string[] {
        const fieldMap = {
            garage_type: "garage_type",
            width: "width",
            length: "length",
            height: "height",
            state_name: "state_name",
            roof_type: "roof_type",
            gauge: "gauge",
            building_type: "building_type",
        };

        return Object.entries(fieldMap)
            .filter(([key]) => params[key])
            .map(([, value]) => value);
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
