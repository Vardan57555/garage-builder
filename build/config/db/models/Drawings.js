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
let Drawings = class Drawings extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], Drawings.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], Drawings.prototype, "map_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: false }),
    __metadata("design:type", String)
], Drawings.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM("$", "%"), allowNull: false, defaultValue: "$" }),
    __metadata("design:type", String)
], Drawings.prototype, "cost_type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], Drawings.prototype, "cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: true, defaultValue: false }),
    __metadata("design:type", Boolean)
], Drawings.prototype, "is_cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM("yes", "no"), allowNull: false, defaultValue: "no" }),
    __metadata("design:type", String)
], Drawings.prototype, "is_default", void 0);
Drawings = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: "drawings", timestamps: false })
], Drawings);
exports.default = Drawings;
//# sourceMappingURL=Drawings.js.map