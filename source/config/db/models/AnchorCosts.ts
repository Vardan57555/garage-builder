import { Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";

export interface IAnchorCosts {
    id?: number;
    anchor_id: string;
    cost: number;
    map_id: number;
    is_concrete: boolean;
    created_at?: number;
    updated_at?: number;
}

interface AnchorCostsCreationAttributes extends Omit<IAnchorCosts, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "anchor_costs", timestamps: false })
export default class AnchorCosts extends Model<IAnchorCosts, AnchorCostsCreationAttributes> {

    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(25), allowNull: false })
    declare anchor_id: string;

    @Default(0)
    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.BOOLEAN, allowNull: false })
    declare is_concrete: boolean;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare created_at: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare updated_at: number;
}
