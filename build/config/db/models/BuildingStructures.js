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
let BuildingStructures = class BuildingStructures extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "map_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "building_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "roof_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(0),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TINYINT, allowNull: false }),
    __metadata("design:type", Boolean)
], BuildingStructures.prototype, "frame_length", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "min_start_length", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "start_length", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "end_length", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(5),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TINYINT, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "distance_on_length", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "start_height", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "min_height", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "max_height", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "min_start_width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "min_width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "max_width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(255), allowNull: true }),
    __metadata("design:type", String)
], BuildingStructures.prototype, "fixed_width", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(2),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TINYINT, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "distance_on_width", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "building_max_length", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT("long"), allowNull: true }),
    __metadata("design:type", String)
], BuildingStructures.prototype, "conditions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: true }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "distance_on_center", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(14),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.SMALLINT, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "default_gauge", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(() => Date.now()),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BIGINT, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "created_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(() => Date.now()),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BIGINT, allowNull: false }),
    __metadata("design:type", Number)
], BuildingStructures.prototype, "updated_at", void 0);
BuildingStructures = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: "building_structures", timestamps: false })
], BuildingStructures);
exports.default = BuildingStructures;
//# sourceMappingURL=BuildingStructures.js.map