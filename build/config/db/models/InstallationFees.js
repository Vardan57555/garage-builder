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
let InstallationFees = class InstallationFees extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: false }),
    __metadata("design:type", Number)
], InstallationFees.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], InstallationFees.prototype, "map_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], InstallationFees.prototype, "start_width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], InstallationFees.prototype, "end_width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], InstallationFees.prototype, "start_length", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], InstallationFees.prototype, "end_length", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], InstallationFees.prototype, "start_height", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], InstallationFees.prototype, "end_height", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 }),
    __metadata("design:type", Number)
], InstallationFees.prototype, "end_wall", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM("yes", "no", "included"), allowNull: false, defaultValue: "no" }),
    __metadata("design:type", String)
], InstallationFees.prototype, "is_end_wall", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 }),
    __metadata("design:type", Number)
], InstallationFees.prototype, "side_wall", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM("yes", "no", "included"), allowNull: false, defaultValue: "no" }),
    __metadata("design:type", String)
], InstallationFees.prototype, "is_side_wall", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM("garage_door", "walkin_door", "window"), allowNull: false }),
    __metadata("design:type", String)
], InstallationFees.prototype, "type", void 0);
InstallationFees = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: "installation_fees", timestamps: false })
], InstallationFees);
exports.default = InstallationFees;
//# sourceMappingURL=InstallationFees.js.map