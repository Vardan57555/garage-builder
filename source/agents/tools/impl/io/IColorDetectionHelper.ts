import {ColorOption} from "@agents/tools/io/IColorChoice";

export interface IColorMatcher {
    /**
     * Runs all matching strategies and returns the matched color or null.
     */
    match(): ColorOption | null;
}
