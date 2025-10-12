import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IGarageDoors {
    id?: number;
    map_id: number;
    is_custom_size?: boolean;
    width: number;
    height: number;
    width_range?: string | null;
    height_range?: string | null;
    cost: number;
    color_cost: number;
    color_cost_combination?: string | null;
    certified_cost: number;
    chain_hoist: number;
    is_45_degree_angle?: boolean;
    degree_45_angle?: number;
    vertical_side_cost?: number;
    side_cost?: number;
    is_certified?: boolean;
    is_chain_hoist?: boolean;
    is_header_seal?: boolean;
    header_seal?: number;
    is_automatic_openers?: boolean;
    automatic_openers?: number;
    end_clearance: number;
    side_clearance: number;
    door_type?: string;
    door_category?: string | null;
    is_default?: string | null;
    show_custom_size?: boolean;
    door_add_ons?: string | null;
}

interface GarageDoorsCreationAttributes extends Omit<IGarageDoors, "id"> {}

@Table({ tableName: "garage_doors", timestamps: false })
export default class GarageDoors extends Model<IGarageDoors, GarageDoorsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare is_custom_size?: boolean;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare width: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare height: number;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare width_range?: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare height_range?: string | null;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare color_cost: number;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare color_cost_combination?: string | null;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare certified_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare chain_hoist: number;

    @Column({ field: "is_45_degree_angle", type: DataType.BOOLEAN, allowNull: true, defaultValue: true })
    declare is_45_degree_angle?: boolean;

    @Column({ field: "45_degree_angle", type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare degree_45_angle?: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare vertical_side_cost?: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare side_cost?: number;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare is_certified?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare is_chain_hoist?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
    declare is_header_seal?: boolean;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare header_seal?: number;

    @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
    declare is_automatic_openers?: boolean;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare automatic_openers?: number;

    @Column({ type: DataType.FLOAT, allowNull: false })
    declare end_clearance: number;

    @Column({ type: DataType.FLOAT, allowNull: false })
    declare side_clearance: number;

    @Column({ type: DataType.STRING(128), allowNull: false, defaultValue: "roll_up_garage_doors" })
    declare door_type?: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare door_category?: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare is_default?: string | null;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare show_custom_size?: boolean;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare door_add_ons?: string | null;
}
