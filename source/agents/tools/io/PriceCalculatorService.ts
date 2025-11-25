import { LeadAgentStateType } from "@agents/LeadAgentState";
import {PriceCalculationResult} from "@agents/tools/impl/io/IPriceCalculator";
import {QuoteBreakdown} from "@agents/tools/impl/io/IVisualization";
import {SelectedAddon} from "@agents/tools/io/IProcessAddon";

export interface IPriceCalculatorService
{
    calculatePrice(state: LeadAgentStateType): Promise<PriceCalculationResult>;

    calculateBreakdown(basePrice: number, width: number, length: number, selectedAddons?: any[]): QuoteBreakdown;

    calculateTotalPrice(basePrice: number, addons: SelectedAddon[]): number
}
