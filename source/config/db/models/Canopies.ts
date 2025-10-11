import { Column, DataType, Model, Table } from "sequelize-typescript";

interface ICanopie {
    map_id: number;
    structure: string;
    cost: number;
    created_at?: Date;
    updated_at?: Date;
}

interface CanopieCreationAttributes extends ICanopie {}

@Table({ tableName: "canopies", timestamps: false })
export default class Canopie extends Model<ICanopie, CanopieCreationAttributes> {
    @Column({ type: DataType.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare structure: string;

    @Column({ type: DataType.FLOAT(10, 2), allowNull: false, defaultValue: 0.0 })
    declare cost: number;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    declare created_at: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at: Date;
}
