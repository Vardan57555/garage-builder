import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IConnectionEndFee {
    id?: number;
    map_id?: number;
    width?: number;
    cost?: number;
    end_cost?: number;
    length: number;
    end_leanto_cost: number;
    added_building_cost: number;
    is_l_and_t_fee: boolean;
}

interface ConnectionEndFeeCreationAttributes extends Omit<IConnectionEndFee, "id"> {}

@Table({ tableName: "connection_end_fees", timestamps: false })
export default class ConnectionEndFee extends Model<IConnectionEndFee, ConnectionEndFeeCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare map_id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare width: number;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare cost: number;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare end_cost: number;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    declare length: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare end_leanto_cost: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare added_building_cost: number;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare is_l_and_t_fee: boolean;
}
