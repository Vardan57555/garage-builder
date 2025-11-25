import {Addon} from "@agents/tools/io/IProcessAddon";

/**
 * Validates and processes addon selections
 */
export class AddonSelectionValidator
{
    /**
     * Check if user is declining addon selection
     */
    static isUserDecline(input: string): boolean {
        return /(no|skip|none|without|don't|nope|nah|nothing)/i.test(input);
    }

    /**
     * Validate input exists and is not empty
     */
    static hasValidInput(input: string | undefined): boolean {
        return !!input?.trim();
    }

    /**
     * Validate addon menu is available
     */
    static hasValidAddonMenu(addonsMenu: Addon[] | undefined): boolean {
        return !!addonsMenu?.length;
    }
}
