/**
 * Dynamic Garage Dimension Calculator
 * Calculates dimensions based on number of cars using formulas
 */
export class DynamicGarageDimensionCalculator {
    /**
     * Standard car width and length
     * Average car dimensions: 6ft wide, 15ft long
     */
    private static readonly CAR_WIDTH = 6;      // feet per car width
    private static readonly CAR_LENGTH = 15;    // feet per car length
    private static readonly STANDARD_HEIGHT = 10; // standard garage height

    /**
     * Calculates garage width based on number of cars
     * Formula: (number_of_cars * car_width) + buffer
     * Example: 2 cars = (2 * 6) + 8 = 20 ft
     */
    private static calculateWidth(numCars: number): number {
        const buffer = 8; // extra space for clearance
        return numCars * this.CAR_WIDTH + buffer;
    }

    /**
     * Calculates garage length based on number of cars
     * Formula: car_length + buffer
     * Length stays relatively constant regardless of car count
     * Example: (15) + 5 = 20 ft
     */
    private static calculateLength(numCars: number): number {
        const buffer = 5; // extra space for door clearance and storage
        return this.CAR_LENGTH + buffer;
    }

    /**
     * Calculates height based on garage type
     * Standard: 10 ft, Truck/RV: 12 ft
     */
    private static calculateHeight(garageType: string | null): number {
        const lowerType = (garageType || '').toLowerCase();
        if (lowerType.includes('truck') || lowerType.includes('rv')) {
            return 12;
        }
        return 10;
    }

    /**
     * Main method: Extract car count and generate dimensions
     * Handles both natural language ("5 cars") and formatted input ("5-car")
     */
    static calculateDimensionsFromInput(userInput: string): {
        numCars: number | null;
        width: number | null;
        length: number | null;
        height: number;
        garageType: string | null;
    } {
        const input = userInput.toLowerCase().trim();

        // Detect special garage types
        const isTruck = /truck\s*garage|truck\s*building/i.test(input);
        const isRV = /rv\s*garage|rv\s*building/i.test(input);

        // Pattern 1: Check for formatted input like "5-car" or "5car"
        const formattedMatch = input.match(/(\d+)[-\s]*cars?/i);
        let numCars = formattedMatch ? parseInt(formattedMatch[1], 10) : null;

        // Pattern 2: Check for natural language "I want a garage for 5 cars"
        if (!numCars) {
            const naturalMatch = input.match(/(?:for|a|)\s+(\d+)\s+cars?/i);
            numCars = naturalMatch ? parseInt(naturalMatch[1], 10) : null;
        }

        let garageType = null;

        if (isTruck) {
            garageType = 'truck';
        } else if (isRV) {
            garageType = 'rv';
        } else if (numCars && numCars > 0) {
            garageType = `${numCars}-car`;
        }

        const height = this.calculateHeight(garageType);
        const width = numCars && numCars > 0 ? this.calculateWidth(numCars) : null;
        const length = numCars && numCars > 0 ? this.calculateLength(numCars) : null;

        return {
            numCars,
            width,
            length,
            height,
            garageType,
        };
    }

    /**
     * Get the calculation formula as a string (for logging/debugging)
     */
    static getFormula(numCars: number): string {
        const widthCalc = `(${numCars} × ${this.CAR_WIDTH}) + 8`;
        const lengthCalc = `${this.CAR_LENGTH} + 5`;
        return `Width: ${widthCalc} = ${this.calculateWidth(numCars)}ft | Length: ${lengthCalc} = ${this.calculateLength(numCars)}ft | Height: ${this.STANDARD_HEIGHT}ft`;
    }
}
