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

export interface IDataSidePrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    min_height?: number;
    max_height?: number;
    length_commas_values?: string;
    side_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataSidePriceCreationAttributes extends Omit<IDataSidePrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_side_price", timestamps: true, paranoid: true })
export default class DataSidePrice extends Model<IDataSidePrice, DataSidePriceCreationAttributes> {
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

    @Column({ type: DataType.BLOB, allowNull: true })
    declare side_row?: Buffer;

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
