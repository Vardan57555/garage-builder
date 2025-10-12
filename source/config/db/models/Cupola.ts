import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table, Default } from "sequelize-typescript";

export interface ICupola {
    id?: number;
    map_id: number;
    structure: string;
    cost: number;
    cupola_type_id?: number;
    created_at: Date;
    updated_at?: Date;
}

interface CupolaCreationAttributes extends Omit<ICupola, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "cupolas", timestamps: false })
export default class Cupola extends Model<ICupola, CupolaCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING, allowNull: false })
    declare structure: string;

    @Column({ type: DataType.FLOAT(10, 2), allowNull: false, defaultValue: 0.0 })
    declare cost: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare cupola_type_id?: number;

    @Default(DataType.NOW)
    @Column({ type: DataType.DATE, allowNull: false })
    declare created_at: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;
}
