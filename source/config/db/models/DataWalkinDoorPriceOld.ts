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

export interface IDataWalkinDoorPriceOld {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    walkin_door_row?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataWalkinDoorPriceOldCreationAttributes
    extends Omit<IDataWalkinDoorPriceOld, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_walkin_door_price_old",  timestamps: true,  paranoid: true })
export default class DataWalkinDoorPriceOld extends Model<IDataWalkinDoorPriceOld, DataWalkinDoorPriceOldCreationAttributes>
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
    declare walkin_door_row?: string;

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
