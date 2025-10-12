import { Table, Column, Model, DataType, PrimaryKey } from "sequelize-typescript";

export interface ISideClosed {
    id: number;
    map_id: number;
    name: string;
    label?: string;
    price_type: '$' | '%' | 'sqft' | 'ft';
    price_of?: string;
    height: number;
    length: number;
    side_close_cost: number;
    vertical_side_cost: number;
    side_close_cost_12: number;
    vertical_side_cost_12: number;
    side_close_cost_other: number;
    vertical_side_cost_other: number;
    side_close_cost_12_other: number;
    vertical_side_cost_12_other: number;
}

interface SideClosedCreationAttributes extends Omit<ISideClosed, "id"> {}

@Table({ tableName: "side_closed", timestamps: false })
export default class SideClosed extends Model<ISideClosed, SideClosedCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: 'metal' })
    declare name: string;

    @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: 'Metal' })
    declare label?: string;

    @Column({ type: DataType.ENUM('$','%','sqft','ft'), allowNull: false, defaultValue: '$' })
    declare price_type: '$' | '%' | 'sqft' | 'ft';

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare price_of?: string;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare height: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare length: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare side_close_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare vertical_side_cost: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare side_close_cost_12: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare vertical_side_cost_12: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare side_close_cost_other: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare vertical_side_cost_other: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare side_close_cost_12_other: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare vertical_side_cost_12_other: number;
}
