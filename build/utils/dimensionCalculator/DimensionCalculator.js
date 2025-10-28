"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicGarageDimensionCalculator = void 0;
class DynamicGarageDimensionCalculator {
    static CAR_WIDTH = 6;
    static CAR_LENGTH = 15;
    static STANDARD_HEIGHT = 10;
    static calculateWidth(numCars) {
        const buffer = 8;
        return numCars * this.CAR_WIDTH + buffer;
    }
    static calculateLength(numCars) {
        const buffer = 5;
        return this.CAR_LENGTH + buffer;
    }
    static calculateHeight(garageType) {
        const lowerType = (garageType || '').toLowerCase();
        if (lowerType.includes('truck') || lowerType.includes('rv')) {
            return 12;
        }
        return 10;
    }
    static calculateDimensionsFromInput(userInput) {
        const input = userInput.toLowerCase().trim();
        const isTruck = /truck\s*garage|truck\s*building/i.test(input);
        const isRV = /rv\s*garage|rv\s*building/i.test(input);
        const formattedMatch = input.match(/(\d+)[-\s]*cars?/i);
        let numCars = formattedMatch ? parseInt(formattedMatch[1], 10) : null;
        if (!numCars) {
            const naturalMatch = input.match(/(?:for|a|)\s+(\d+)\s+cars?/i);
            numCars = naturalMatch ? parseInt(naturalMatch[1], 10) : null;
        }
        let garageType = null;
        if (isTruck) {
            garageType = 'truck';
        }
        else if (isRV) {
            garageType = 'rv';
        }
        else if (numCars && numCars > 0) {
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
    static getFormula(numCars) {
        const widthCalc = `(${numCars} × ${this.CAR_WIDTH}) + 8`;
        const lengthCalc = `${this.CAR_LENGTH} + 5`;
        return `Width: ${widthCalc} = ${this.calculateWidth(numCars)}ft | Length: ${lengthCalc} = ${this.calculateLength(numCars)}ft | Height: ${this.STANDARD_HEIGHT}ft`;
    }
}
exports.DynamicGarageDimensionCalculator = DynamicGarageDimensionCalculator;
//# sourceMappingURL=DimensionCalculator.js.map