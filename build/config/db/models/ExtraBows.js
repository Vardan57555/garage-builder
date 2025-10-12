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
let ExtraBows = class ExtraBows extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: false }),
    __metadata("design:type", Number)
], ExtraBows.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: false }),
    __metadata("design:type", Number)
], ExtraBows.prototype, "map_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false }),
    __metadata("design:type", Number)
], ExtraBows.prototype, "width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false }),
    __metadata("design:type", Number)
], ExtraBows.prototype, "height", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], ExtraBows.prototype, "cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT(10, 2), allowNull: false, defaultValue: 0.0 }),
    __metadata("design:type", Number)
], ExtraBows.prototype, "single_leg", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT(10, 2), allowNull: false, defaultValue: 0.0 }),
    __metadata("design:type", Number)
], ExtraBows.prototype, "double_leg", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT(10, 2), allowNull: false, defaultValue: 0.0 }),
    __metadata("design:type", Number)
], ExtraBows.prototype, "ladder_leg", void 0);
ExtraBows = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: "extra_bows", timestamps: false })
], ExtraBows);
exports.default = ExtraBows;
//# sourceMappingURL=ExtraBows.js.map