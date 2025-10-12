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

export interface IDataWalkinDoorPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    walkin_data?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataWalkinDoorPriceCreationAttributes
    extends Omit<IDataWalkinDoorPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_walkin_door_price",  timestamps: true,  paranoid: true })
export default class DataWalkinDoorPrice
    extends Model<IDataWalkinDoorPrice, DataWalkinDoorPriceCreationAttributes>
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

    @Column({ type: DataType.TEXT, allowNull: true })
    declare walkin_data?: string;

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
