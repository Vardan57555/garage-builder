import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {QuoteBreakdown} from "@agents/tools/io/IVisualization";

/**
 * Formats quote responses
 */
export class QuoteResponseFormatter
{

    /**
     * Format final quote with image
     */
    public static formatFinalQuote(params: UserFriendlyParams, breakdown: QuoteBreakdown, selectedAddons: any[] = [], imageBase64: string | null = null): string {

        let response = `
        TOTAL ESTIMATED PRICE $${breakdown.finalTotal.toFixed(2)} for : Width: ${params.width}' | Length: ${params.length}' | Height: ${params.height}
🎨 BUILDING VISUALIZATION:
`;

        if (imageBase64) {
            response += `![Garage Rendering](${imageBase64})
`;
        } else {
            response += `📐 **Visualization unavailable** - Contact support for rendering

`;
        }


        response += `
Like the design? (Contact us!)
Want to tweak the garage design? I can update the image and update the pricing
`;

        return response;
    }
}
