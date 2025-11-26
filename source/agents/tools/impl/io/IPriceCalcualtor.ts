import {QuoteBreakdown} from "@agents/tools/io/IVisualization";

export interface IPriceCalculator
{
    calculateBreakdown(basePrice: number, width: number, length: number, selectedAddons?: any[]): QuoteBreakdown;
}
