import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IConnectionFee {
    id?: number;
    map_id: number;
    length: number;
    cost: number;
    end_cost?: number;
}

interface ConnectionFeeCreationAttributes extends Omit<IConnectionFee, "id"> {}

@Table({ tableName: "connection_fees", timestamps: false })
export default class ConnectionFee extends Model<IConnectionFee, ConnectionFeeCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare length: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare cost: number;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare end_cost: number;
}
