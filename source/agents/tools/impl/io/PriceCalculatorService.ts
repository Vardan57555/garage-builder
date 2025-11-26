import { LeadAgentStateType } from "@agents/LeadAgentState";
import {SelectedAddon} from "@agents/tools/io/IProcessAddon";
import {PriceCalculationResult} from "@agents/tools/io/IPriceCalculator";
import {QuoteBreakdown} from "@agents/tools/io/IVisualization";

export interface IPriceCalculatorService
{
    calculatePrice(state: LeadAgentStateType): Promise<PriceCalculationResult>;

    calculateBreakdown(basePrice: number, width: number, length: number, selectedAddons?: any[]): QuoteBreakdown;

    calculateTotalPrice(basePrice: number, addons: SelectedAddon[]): number
}
