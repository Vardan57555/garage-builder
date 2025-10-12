import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataAddOnPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    add_on_row?: Buffer;
    columns_status?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataAddOnPriceCreationAttributes extends Omit<IDataAddOnPrice, "id"> {}

@Table({ tableName: "data_add_on_price", timestamps: false })
export default class DataAddOnPrice extends Model<IDataAddOnPrice, DataAddOnPriceCreationAttributes> {
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
    declare add_on_row?: Buffer;

    @Column({ type: DataType.STRING(1024), allowNull: true })
    declare columns_status?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
