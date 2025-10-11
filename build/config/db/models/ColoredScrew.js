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
let ColoredScrew = class ColoredScrew extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "colored_screw_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "map_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "start_width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "end_width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "start_length", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "end_length", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "start_height", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "end_height", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT(10, 2), allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "start_price", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DOUBLE(10, 2), allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "end_price", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(10), allowNull: false }),
    __metadata("design:type", String)
], ColoredScrew.prototype, "cost_type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT(10, 2), allowNull: false }),
    __metadata("design:type", Number)
], ColoredScrew.prototype, "cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(15), allowNull: true, comment: "1 => Total Building Amount 2 => Base Price 3 => Wall Price" }),
    __metadata("design:type", String)
], ColoredScrew.prototype, "percentage_of", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TINYINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Boolean)
], ColoredScrew.prototype, "is_cumulative", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATE, allowNull: false, defaultValue: sequelize_typescript_1.DataType.NOW }),
    __metadata("design:type", Date)
], ColoredScrew.prototype, "created_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATE, allowNull: true }),
    __metadata("design:type", Date)
], ColoredScrew.prototype, "updated_at", void 0);
ColoredScrew = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: "colored_screw", timestamps: false })
], ColoredScrew);
exports.default = ColoredScrew;
//# sourceMappingURL=ColoredScrew.js.map