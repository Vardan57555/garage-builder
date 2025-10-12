import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataEndConnectionPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    end_connection_row?: Buffer;
    end_lean_tos_fees_row?: string;
    l_and_t_fees_row?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataEndConnectionPriceCreationAttributes extends Omit<IDataEndConnectionPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_end_connection_price", timestamps: false })
export default class DataEndConnectionPrice extends Model<IDataEndConnectionPrice, DataEndConnectionPriceCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare manufacturer_id?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare region_id?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare building_id?: number;

    @Column({ type: DataType.BLOB("long"), allowNull: true })
    declare end_connection_row?: Buffer;

    @Column({ type: DataType.TEXT("long"), allowNull: true })
    declare end_lean_tos_fees_row?: string;

    @Column({ type: DataType.TEXT("long"), allowNull: true })
    declare l_and_t_fees_row?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
