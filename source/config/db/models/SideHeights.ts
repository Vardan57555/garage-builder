import { Table, Column, Model, DataType, PrimaryKey } from "sequelize-typescript";

export interface ISideHeights {
    id: number;
    map_id: number;
    width: number;
    height: number;
    smaller_height: number;
    length: number;
    leg_height_cost: number;
    side_close_cost: number;
    vertical_side_cost: number;
    side_close_cost_12: number;
    vertical_side_cost_12: number;
    double_leg_baserail_cost: number;
    leg_height_cost_12?: number;
    double_leg_baserail_cost_12?: number;
    lifttype?: number;
    lifttype_price: number;
    ladder_cost: number;
    ladder_cost_12: number;
    side_close_cost_other: number;
    vertical_side_cost_other: number;
    side_close_cost_12_other: number;
    vertical_side_cost_12_other: number;
}

interface SideHeightsCreationAttributes extends Omit<ISideHeights, "id"> {}

@Table({ tableName: "side_heights", timestamps: false })
export default class SideHeights extends Model<ISideHeights, SideHeightsCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare width: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare height: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare smaller_height: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare length: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare leg_height_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare side_close_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare vertical_side_cost: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare side_close_cost_12: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare vertical_side_cost_12: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare double_leg_baserail_cost: number;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare leg_height_cost_12?: number;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare double_leg_baserail_cost_12?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare lifttype?: number;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    declare lifttype_price: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare ladder_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare ladder_cost_12: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare side_close_cost_other: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare vertical_side_cost_other: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare side_close_cost_12_other: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare vertical_side_cost_12_other: number;
}
