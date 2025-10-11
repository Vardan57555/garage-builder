import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataLegPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    min_height?: number;
    max_height?: number;
    length_commas_values?: string;
    gauge_prices_12?: boolean;
    side_prices_gauge_12: boolean;
    side_other_leg: boolean;
    building_structre_row?: string;
    side_row?: string;
    leg_height_width_structure_row?: string;
    applicable_wainscot_horizontal?: string;
    applicable_wainscot_vertical?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataLegPriceCreationAttributes extends Omit<IDataLegPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_leg_price", timestamps: false })
export default class DataLegPrice extends Model<IDataLegPrice, DataLegPriceCreationAttributes> {
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

    @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
    declare gauge_prices_12?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare side_prices_gauge_12: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare side_other_leg: boolean;

    @Column({ type: DataType.TEXT("long"), allowNull: true })
    declare building_structre_row?: string;

    @Column({ type: DataType.TEXT("long"), allowNull: true })
    declare side_row?: string;

    @Column({ type: DataType.TEXT("long"), allowNull: true, comment: "New structure with width" })
    declare leg_height_width_structure_row?: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare applicable_wainscot_horizontal?: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare applicable_wainscot_vertical?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
