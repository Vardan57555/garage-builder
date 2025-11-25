import {QuoteBreakdown} from "@agents/tools/impl/io/IVisualization";

export interface IPriceCalculator
{
    calculateBreakdown(basePrice: number, width: number, length: number, selectedAddons?: any[]): QuoteBreakdown;
}
