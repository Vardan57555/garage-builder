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

export interface IDataWrapAroundConnectionPrice {
    id?: number;
    manufacturer_id?: number | null;
    region_id?: number | null;
    building_id?: number | null;
    min_width?: number | null;
    max_width?: number | null;
    min_height?: number | null;
    max_height?: number | null;
    distance_on_width?: number | null;
    wrap_connection_row?: Buffer | null;
    created_at?: Date | null;
    updated_at?: Date | null;
    deleted_at?: Date | null;
}

interface DataWrapAroundConnectionPriceCreationAttributes extends Omit<IDataWrapAroundConnectionPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_wrap_around_connection_price", timestamps: true, paranoid: true })
export default class DataWrapAroundConnectionPrice extends Model<IDataWrapAroundConnectionPrice, DataWrapAroundConnectionPriceCreationAttributes>
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

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_width?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_width?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_height?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_height?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare distance_on_width?: number | null;

    @Column({ type: DataType.BLOB, allowNull: true })
    declare wrap_connection_row?: Buffer | null;

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
