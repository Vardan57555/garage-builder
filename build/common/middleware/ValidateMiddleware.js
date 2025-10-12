"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const ValidationError_1 = require("../../errors/ValidationError");
function validate(validator, target) {
    return (req, _res, next) => {
        const validation = validator();
        if (validation.error) {
            return next(new ValidationError_1.ValidationError(ValidationError_1.ValidationError.INPUT, validation.error.message));
        }
        req[target] = validation.value;
        next();
    };
}
//# sourceMappingURL=ValidateMiddleware.js.map