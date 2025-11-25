import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {QuoteBreakdown} from "@agents/tools/impl/io/IVisualization";

/**
 * Formats quote responses
 */
export class QuoteResponseFormatter
{
    private static readonly line = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

    /**
     * Format final quote with image
     */
    public static formatFinalQuote(params: UserFriendlyParams, breakdown: QuoteBreakdown, selectedAddons: any[] = [], imageBase64: string | null = null): string {
        const sqft = params.width! * params.length!;

        let response = `✅ YOUR FINAL GARAGE QUOTE

📐 Building Specifications:
• Width: ${params.width}' | Length: ${params.length}' | Height: ${params.height}'
• Roof Type: ${params.roof_type || "Standard"}

${this.line}
🎨 BUILDING VISUALIZATION:
${this.line}

`;

        if (imageBase64) {
            response += `![Garage Rendering](${imageBase64})

✨ **Professional ComfyUI-generated photorealistic rendering**
High-quality architectural visualization
Stable Diffusion XL rendering with professional post-processing
`;
        } else {
            response += `📐 **Visualization unavailable** - Contact support for rendering

`;
        }

        response += `
${this.line}
📊 DETAILED PRICE BREAKDOWN:
${this.line}

**Building Kit & Materials:**
• Base Building Package: $${breakdown.basePrice.toFixed(2)}

**Installation & Construction:**
• Installation Labor (50% of kit): $${breakdown.laborCost.toFixed(2)}
• Concrete Foundation (${sqft} sq ft @ $8.50/sq ft): $${breakdown.foundationCost.toFixed(2)}
• Delivery & Site Preparation: $${breakdown.deliveryCost.toFixed(2)}
• Contingency & Misc (5%): $${breakdown.contingency.toFixed(2)}`;

        if (selectedAddons.length > 0) {
            response += `\n\n**Selected Add-ons:**`;
            selectedAddons.forEach((addon) => {
                response += `\n• ${addon.label}: $${(addon.cost || 0).toFixed(2)}`;
            });
            response += `\n• Add-ons Total: +$${breakdown.addonTotal.toFixed(2)}`;
        }

        response += `

${this.line}
💰 FINAL ESTIMATED PRICE: $${breakdown.finalTotal.toFixed(2)}
${this.line}

✅ What's Included:
• Building kit and all materials
• Professional installation labor
• Foundation slab preparation
• Delivery and site setup
${selectedAddons.length > 0 ? `• ${selectedAddons.length} add-on(s)` : ""}
• 5% contingency buffer
• Professional visualization

📞 Ready to Order?
Contact us to discuss:
• Custom modifications
• Financing options
• Installation timeline (2-4 weeks)
• Warranty details`;

        return response;
    }
}
