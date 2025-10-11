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
let DeluxTwoTone = class DeluxTwoTone extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], DeluxTwoTone.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(50), allowNull: false, defaultValue: "metal" }),
    __metadata("design:type", String)
], DeluxTwoTone.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(50), allowNull: true, defaultValue: "Metal" }),
    __metadata("design:type", String)
], DeluxTwoTone.prototype, "label", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], DeluxTwoTone.prototype, "length", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], DeluxTwoTone.prototype, "cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], DeluxTwoTone.prototype, "map_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0 }),
    __metadata("design:type", Number)
], DeluxTwoTone.prototype, "on_end_horizontal", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0 }),
    __metadata("design:type", Number)
], DeluxTwoTone.prototype, "on_end_vertical", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0 }),
    __metadata("design:type", Number)
], DeluxTwoTone.prototype, "on_side_horizontal", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0 }),
    __metadata("design:type", Number)
], DeluxTwoTone.prototype, "on_side_vertical", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 }),
    __metadata("design:type", Number)
], DeluxTwoTone.prototype, "width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
        defaultValue: "$"
    }),
    __metadata("design:type", String)
], DeluxTwoTone.prototype, "horizontal_cost_type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
        defaultValue: "$"
    }),
    __metadata("design:type", String)
], DeluxTwoTone.prototype, "vertical_cost_type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: true }),
    __metadata("design:type", String)
], DeluxTwoTone.prototype, "horizontal_price_of", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: true }),
    __metadata("design:type", String)
], DeluxTwoTone.prototype, "vertical_price_of", void 0);
DeluxTwoTone = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: "delux_two_tone", timestamps: false })
], DeluxTwoTone);
exports.default = DeluxTwoTone;
//# sourceMappingURL=DeluxTwoTone.js.map