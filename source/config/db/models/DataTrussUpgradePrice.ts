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

export interface IDataTrussUpgradePrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    sizes?: string;
    min_width?: number;
    max_width?: number;
    min_length?: number;
    max_length?: number;
    distance_on_width?: number;
    distance_on_length?: number;
    truss_upgrade_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataTrussUpgradePriceCreationAttributes
    extends Omit<IDataTrussUpgradePrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_truss_upgrade_price",  timestamps: true,  paranoid: true })
export default class DataTrussUpgradePrice
    extends Model<IDataTrussUpgradePrice, DataTrussUpgradePriceCreationAttributes>
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

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare sizes?: string;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_width?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_width?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_length?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_length?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare distance_on_width?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare distance_on_length?: number;

    @Column({ type: DataType.BLOB, allowNull: true })
    declare truss_upgrade_row?: Buffer;

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
