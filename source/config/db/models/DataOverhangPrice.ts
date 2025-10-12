import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataOverhangPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    min_height?: number;
    max_height?: number;
    length_commas_values?: string;
    overhang_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataOverhangPriceCreationAttributes extends Omit<IDataOverhangPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_overhang_price", timestamps: false })
export default class DataOverhangPrice extends Model<IDataOverhangPrice, DataOverhangPriceCreationAttributes> {
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

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_height?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_height?: number;

    @Column({ type: DataType.STRING(250), allowNull: true })
    declare length_commas_values?: string;

    @Column({ type: DataType.BLOB("long"), allowNull: true })
    declare overhang_row?: Buffer;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
