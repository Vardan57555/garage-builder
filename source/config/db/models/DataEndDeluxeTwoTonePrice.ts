import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataEndDeluxeTwoTonePrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    end_deluxe_two_tone_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataEndDeluxeTwoTonePriceCreationAttributes extends Omit<IDataEndDeluxeTwoTonePrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_end_deluxe_two_tone_price", timestamps: false })
export default class DataEndDeluxeTwoTonePrice extends Model<IDataEndDeluxeTwoTonePrice, DataEndDeluxeTwoTonePriceCreationAttributes> {
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
    declare end_deluxe_two_tone_row?: Buffer;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
