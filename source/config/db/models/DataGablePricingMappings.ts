import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataGablePricingMappings {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    row_data?: string;
    created_at?: Date;
    updated_at?: Date;
}

interface DataGablePricingMappingsCreationAttributes extends Omit<IDataGablePricingMappings, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "data_gable_pricing_mappings", timestamps: false })
export default class DataGablePricingMappings extends Model<IDataGablePricingMappings, DataGablePricingMappingsCreationAttributes> {
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

    @Column({ type: DataType.TEXT('long'), allowNull: true })
    declare row_data?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;
}
