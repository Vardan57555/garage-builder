"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupValidator = setupValidator;
function setupValidator(obj, schema, stripUnknown = true, allowUnknown = true) {
    return schema.validate(obj, { stripUnknown, allowUnknown });
}
//# sourceMappingURL=SetupValidator.js.map