import {Addon, SelectedAddon} from "@agents/tools/io/IProcessAddon";

export interface IAddonSelectionParser
{
    /**
     * Parses user input and returns matched addons.
     * Supports numeric selections, quantity-based selections,
     * and keyword-based matching.
     */
    parse(userInput: string, addonsMenu: Addon[]): SelectedAddon[];
}
