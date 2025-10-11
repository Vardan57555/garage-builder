import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataJTrimsPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    jtrims_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataJTrimsPriceCreationAttributes extends Omit<IDataJTrimsPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_jtrims_price", timestamps: false })
export default class DataJTrimsPrice extends Model<IDataJTrimsPrice, DataJTrimsPriceCreationAttributes> {
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
    declare jtrims_row?: Buffer;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
