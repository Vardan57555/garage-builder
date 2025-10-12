import { Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";

export interface IAddonWidth {
    id?: number;
    map_id?: number;
    width: number;
    peak_braces: number;
    overhang: number;
    end_cross_bracing: number;
    jtrim: number;
    fourth_center_end_cost: number;
    created_at?: number;
    updated_at?: number;
}

interface AddonWidthCreationAttributes extends Omit<IAddonWidth, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "addons_width", timestamps: false })
export default class AddonWidth extends Model<IAddonWidth, AddonWidthCreationAttributes> {

    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare map_id?: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare width: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare peak_braces: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare overhang: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare end_cross_bracing: number;

    @Default(0)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare jtrim: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare fourth_center_end_cost: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare created_at: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare updated_at: number;
}
