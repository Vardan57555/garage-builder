import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
} from "sequelize-typescript";

export interface IDataSideDeluxeTwoTonePrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    side_deluxe_two_tone_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataSideDeluxeTwoTonePriceCreationAttributes
    extends Omit<IDataSideDeluxeTwoTonePrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_side_deluxe_two_tone_price", timestamps: true, paranoid: true })
export default class DataSideDeluxeTwoTonePrice
    extends Model<IDataSideDeluxeTwoTonePrice, DataSideDeluxeTwoTonePriceCreationAttributes>
{
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
    declare side_deluxe_two_tone_row?: Buffer;

    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @UpdatedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @DeletedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
