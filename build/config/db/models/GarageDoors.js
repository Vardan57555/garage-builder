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
let GarageDoors = class GarageDoors extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "map_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: false, defaultValue: false }),
    __metadata("design:type", Boolean)
], GarageDoors.prototype, "is_custom_size", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "height", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(20), allowNull: true }),
    __metadata("design:type", String)
], GarageDoors.prototype, "width_range", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(20), allowNull: true }),
    __metadata("design:type", String)
], GarageDoors.prototype, "height_range", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "color_cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true }),
    __metadata("design:type", String)
], GarageDoors.prototype, "color_cost_combination", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "certified_cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "chain_hoist", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ field: "is_45_degree_angle", type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: true, defaultValue: true }),
    __metadata("design:type", Boolean)
], GarageDoors.prototype, "is_45_degree_angle", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ field: "45_degree_angle", type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "degree_45_angle", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "vertical_side_cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "side_cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: false, defaultValue: false }),
    __metadata("design:type", Boolean)
], GarageDoors.prototype, "is_certified", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: false, defaultValue: false }),
    __metadata("design:type", Boolean)
], GarageDoors.prototype, "is_chain_hoist", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: true, defaultValue: false }),
    __metadata("design:type", Boolean)
], GarageDoors.prototype, "is_header_seal", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "header_seal", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: true, defaultValue: false }),
    __metadata("design:type", Boolean)
], GarageDoors.prototype, "is_automatic_openers", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT, allowNull: true, defaultValue: 0 }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "automatic_openers", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "end_clearance", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT, allowNull: false }),
    __metadata("design:type", Number)
], GarageDoors.prototype, "side_clearance", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(128), allowNull: false, defaultValue: "roll_up_garage_doors" }),
    __metadata("design:type", String)
], GarageDoors.prototype, "door_type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: true }),
    __metadata("design:type", String)
], GarageDoors.prototype, "door_category", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(20), allowNull: true }),
    __metadata("design:type", String)
], GarageDoors.prototype, "is_default", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: false, defaultValue: false }),
    __metadata("design:type", Boolean)
], GarageDoors.prototype, "show_custom_size", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true }),
    __metadata("design:type", String)
], GarageDoors.prototype, "door_add_ons", void 0);
GarageDoors = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: "garage_doors", timestamps: false })
], GarageDoors);
exports.default = GarageDoors;
//# sourceMappingURL=GarageDoors.js.map