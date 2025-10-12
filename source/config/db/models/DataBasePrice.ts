import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataBasePrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    min_width?: number;
    max_width?: number;
    min_length?: number;
    max_length?: number;
    min_height?: number;
    max_height?: number;
    distance_on_width?: number;
    distance_on_length?: number;
    building_structre_row?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataBasePriceCreationAttributes extends Omit<IDataBasePrice, "id"> {}

@Table({ tableName: "data_base_price", timestamps: false })
export default class DataBasePrice extends Model<IDataBasePrice, DataBasePriceCreationAttributes> {
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
    declare min_width?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_width?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_length?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_length?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_height?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_height?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare distance_on_width?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare distance_on_length?: number;

    @Column({ type: DataType.TEXT("long"), allowNull: true })
    declare building_structre_row?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
