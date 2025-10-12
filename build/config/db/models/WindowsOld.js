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
let WindowsOld = class WindowsOld extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], WindowsOld.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], WindowsOld.prototype, "map_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], WindowsOld.prototype, "width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], WindowsOld.prototype, "height", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], WindowsOld.prototype, "cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(0),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT, allowNull: true }),
    __metadata("design:type", Number)
], WindowsOld.prototype, "on_side_cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(0),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], WindowsOld.prototype, "vertical_side_cost", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(0),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT, allowNull: true }),
    __metadata("design:type", Number)
], WindowsOld.prototype, "frameout_cost_side", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(0),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.FLOAT, allowNull: true }),
    __metadata("design:type", Number)
], WindowsOld.prototype, "frameout_cost_end", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(0),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TINYINT, allowNull: true }),
    __metadata("design:type", Number)
], WindowsOld.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)('standard_windows'),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(128), allowNull: false }),
    __metadata("design:type", String)
], WindowsOld.prototype, "door_type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: true }),
    __metadata("design:type", String)
], WindowsOld.prototype, "door_category", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(20), allowNull: true }),
    __metadata("design:type", String)
], WindowsOld.prototype, "is_default", void 0);
WindowsOld = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: "windows_old", timestamps: false })
], WindowsOld);
exports.default = WindowsOld;
//# sourceMappingURL=WindowsOld.js.map