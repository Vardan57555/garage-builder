"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
let StateManufacturerBuildingMapping = class StateManufacturerBuildingMapping extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], StateManufacturerBuildingMapping.prototype, "map_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: true }),
    __metadata("design:type", Number)
], StateManufacturerBuildingMapping.prototype, "manufacturer_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(255), allowNull: true }),
    __metadata("design:type", String)
], StateManufacturerBuildingMapping.prototype, "state_ids", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: true }),
    __metadata("design:type", Number)
], StateManufacturerBuildingMapping.prototype, "building_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: true }),
    __metadata("design:type", Number)
], StateManufacturerBuildingMapping.prototype, "lean_to_building_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: true }),
    __metadata("design:type", Number)
], StateManufacturerBuildingMapping.prototype, "region_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(0),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TINYINT, allowNull: false }),
    __metadata("design:type", Number)
], StateManufacturerBuildingMapping.prototype, "heavy_snow", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(0),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TINYINT, allowNull: true }),
    __metadata("design:type", Number)
], StateManufacturerBuildingMapping.prototype, "default_building", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(0),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TINYINT, allowNull: false, comment: "0:No,1:Yes" }),
    __metadata("design:type", Number)
], StateManufacturerBuildingMapping.prototype, "is_new_leg_height_structure", void 0);
StateManufacturerBuildingMapping = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: "state_manufacturer_building_mapping", timestamps: false })
], StateManufacturerBuildingMapping);
exports.default = StateManufacturerBuildingMapping;
//# sourceMappingURL=StateManufacturerBuildingMapping.js.map