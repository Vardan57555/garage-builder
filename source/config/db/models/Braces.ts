import { Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";

export interface IBraces {
    id?: number;
    map_id: number;
    length: number;
    cost: number;
    bracing_feet: number;
    created_at?: number;
    updated_at?: number;
}

interface BracesCreationAttributes extends Omit<IBraces, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "braces", timestamps: false })
export default class Braces extends Model<IBraces, BracesCreationAttributes> {

    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare length: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare cost: number;

    @Default(0)
    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare bracing_feet: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare created_at: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare updated_at: number;
}
