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

export interface IDataWindowPriceOld {
    id?: number;
    manufacturer_id?: number | null;
    region_id?: number | null;
    building_id?: number | null;
    window_row?: string | null;
    created_at?: Date | null;
    updated_at?: Date | null;
    deleted_at?: Date | null;
}

interface DataWindowPriceOldCreationAttributes
    extends Omit<IDataWindowPriceOld, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_window_price_old", timestamps: true, paranoid: true })
export default class DataWindowPriceOld
    extends Model<IDataWindowPriceOld, DataWindowPriceOldCreationAttributes>
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

    @Column({ type: DataType.TEXT, allowNull: true })
    declare window_row?: string | null;

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
