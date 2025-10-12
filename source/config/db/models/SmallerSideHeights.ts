import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface ISmallerSideHeights {
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
    lifttype?: number | null;
    lifttype_price: number;
    ladder_cost: number;
    ladder_cost_12: number;
    side_close_cost_other: number;
    vertical_side_cost_other: number;
    side_close_cost_12_other: number;
    vertical_side_cost_12_other: number;
}

interface SmallerSideHeightsCreationAttributes extends Omit<ISmallerSideHeights, "id"> {}

@Table({ tableName: "smaller_side_heights", timestamps: false })
export default class SmallerSideHeights extends Model<ISmallerSideHeights, SmallerSideHeightsCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Default(0)
    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare width: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare height: number;

    @Default(0)
    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare smaller_height: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare length: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare leg_height_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare side_close_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare vertical_side_cost: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare side_close_cost_12: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare vertical_side_cost_12: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare double_leg_baserail_cost: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: true })
    declare leg_height_cost_12?: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: true })
    declare double_leg_baserail_cost_12?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare lifttype?: number | null;

    @Default(0)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare lifttype_price: number;

    @Default(0)
    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare ladder_cost: number;

    @Default(0)
    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare ladder_cost_12: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare side_close_cost_other: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare vertical_side_cost_other: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare side_close_cost_12_other: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare vertical_side_cost_12_other: number;
}
