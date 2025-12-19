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
    public static formatFinalQuote(params: UserFriendlyParams, breakdown: QuoteBreakdown, imageBase64: string | null = null): string
    {
        let response: string = `
The total estimated price is $${breakdown.finalTotal.toFixed(2)} for a building visualization with dimensions: ${params.width} width x ${params.length} length x ${params.height} height
`;

        if (imageBase64)
        {
            response += `\n![Garage Rendering](${imageBase64})\n`;
        }
        else
        {
            response += `\n📐 **Visualization unavailable** - Contact support for rendering\n`;
        }

        response += `
---

Like the design? [📧 Contact Us](#contact-button) to discuss your project!

Want to tweak the garage design? I can update the image and pricing for you.
`;

        return response;
    }
}
