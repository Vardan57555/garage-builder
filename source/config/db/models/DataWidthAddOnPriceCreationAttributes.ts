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

export interface IDataWidthAddOnPrice {
    id?: number;
    manufacturer_id?: number | null;
    region_id?: number | null;
    building_id?: number | null;
    add_on_row?: Buffer | null;
    columns_status?: string | null;
    created_at?: Date | null;
    updated_at?: Date | null;
    deleted_at?: Date | null;
}

interface DataWidthAddOnPriceCreationAttributes
    extends Omit<IDataWidthAddOnPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({tableName: "data_width_add_on_price", timestamps: true, paranoid: true })
export default class DataWidthAddOnPrice
    extends Model<IDataWidthAddOnPrice, DataWidthAddOnPriceCreationAttributes>
{
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare manufacturer_id?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare region_id?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare building_id?: number | null;

    @Column({ type: DataType.BLOB, allowNull: true })
    declare add_on_row?: Buffer | null;

    @Column({ type: DataType.STRING(1024), allowNull: true })
    declare columns_status?: string | null;

    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date | null;

    @UpdatedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date | null;

    @DeletedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date | null;
}
