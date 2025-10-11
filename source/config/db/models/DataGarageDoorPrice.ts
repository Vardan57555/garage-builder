import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataGarageDoorPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    garage_door_row?: Buffer;
    column_status?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataGarageDoorPriceCreationAttributes extends Omit<IDataGarageDoorPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_garage_door_price", timestamps: false })
export default class DataGarageDoorPrice extends Model<IDataGarageDoorPrice, DataGarageDoorPriceCreationAttributes> {
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

    @Column({ type: DataType.BLOB, allowNull: true })
    declare garage_door_row?: Buffer;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare column_status?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
