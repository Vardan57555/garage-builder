export class StateDataValidator
{
    /**
     * Async method to normalize and validate a state string.
     *
     * @param stateName - The state name or abbreviation to validate.
     * @returns The normalized state name if valid, null otherwise.
     */

    public static async validateState(stateName: string, mapStateToDB: (name: string) => Promise<any>): Promise<{ isValid: boolean, normalizedName?: string }> {
        try {
            const normalizedName = StateDataValidator.normalizeStateName(stateName);

            if (!normalizedName) return { isValid: false };

            const mapping = await mapStateToDB(normalizedName);
            return {
                isValid: mapping !== null,
                normalizedName,
            };
        } catch (error) {
            console.warn("[StateDataValidator] State validation failed:", error);
            return { isValid: false };
        }
    }

    /**
     * Normalizes a state input string to a full state name.
     *
     * @param stateInput - The user input for state.
     * @returns The normalized state name, or null if invalid.
     */
    private static normalizeStateName(stateInput: string): string | null {
        const stateAbbreviationMap: Record<string, string> = {
            "tx": "Texas", "ca": "California", "fl": "Florida", "ny": "New York",
            "pa": "Pennsylvania", "il": "Illinois", "oh": "Ohio", "ga": "Georgia",
            "nc": "North Carolina", "mi": "Michigan", "nj": "New Jersey", "va": "Virginia",
            "wa": "Washington", "az": "Arizona", "ma": "Massachusetts", "tn": "Tennessee",
            "md": "Maryland", "mo": "Missouri", "wi": "Wisconsin", "co": "Colorado",
            "mn": "Minnesota", "sc": "South Carolina", "al": "Alabama", "la": "Louisiana",
            "ky": "Kentucky", "or": "Oregon", "ok": "Oklahoma", "ct": "Connecticut",
            "ia": "Iowa", "nv": "Nevada", "ar": "Arkansas", "ms": "Mississippi",
            "ks": "Kansas", "ut": "Utah", "nm": "New Mexico", "ne": "Nebraska",
            "id": "Idaho", "me": "Maine", "mt": "Montana", "ri": "Rhode Island",
            "de": "Delaware", "sd": "South Dakota", "nd": "North Dakota", "ak": "Alaska",
            "hi": "Hawaii", "wy": "Wyoming", "vt": "Vermont", "nh": "New Hampshire",
            "wv": "West Virginia",
        };

        const validStates = Object.values(stateAbbreviationMap);
        const normalized = stateInput.trim().toLowerCase();

        const abbrMatch = normalized.match(/\b([a-z]{2})\b/);
        if (abbrMatch && stateAbbreviationMap[abbrMatch[1]]) {
            return stateAbbreviationMap[abbrMatch[1]];
        }

        const fullMatch = validStates.find(s => normalized.includes(s.toLowerCase()));
        if (fullMatch) return fullMatch;

        const exactMatch = validStates.find(s => s.toLowerCase() === normalized);
        if (exactMatch) return exactMatch;

        return null;
    }

    /**
     * Get list of all valid states for user reference
     * @returns {string} Formatted string of valid states
     */
    public static getValidStatesMessage(): string
    {
        const validStates = [
            "Texas", "California", "Florida", "New York", "Pennsylvania",
            "Illinois", "Ohio", "Georgia", "North Carolina", "Michigan",
            "New Jersey", "Virginia", "Washington", "Arizona", "Massachusetts",
            "Tennessee", "Maryland", "Missouri", "Wisconsin", "Colorado",
            "Minnesota", "South Carolina", "Alabama", "Louisiana", "Kentucky",
            "Oregon", "Oklahoma", "Connecticut", "Iowa", "Nevada",
            "Arkansas", "Mississippi", "Kansas", "Utah", "New Mexico",
            "Nebraska", "Idaho", "Maine", "Montana", "Rhode Island",
            "Delaware", "South Dakota", "North Dakota", "Alaska", "Hawaii",
            "Wyoming", "Vermont", "New Hampshire", "West Virginia"
        ];

        return `Valid states: ${validStates.join(", ")}`;
    }
}
