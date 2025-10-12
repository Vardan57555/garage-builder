import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataFourFeetMapping {
    id?: number;
    manufacturer_id: number;
    region_id: number;
    building_id: number;
    row_data: string;
    created_at?: Date;
    updated_at?: Date;
}

interface DataFourFeetMappingCreationAttributes extends Omit<IDataFourFeetMapping, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "data_four_feet_mapping", timestamps: false })
export default class DataFourFeetMapping extends Model<IDataFourFeetMapping, DataFourFeetMappingCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare manufacturer_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare region_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare building_id: number;

    @Column({ type: DataType.TEXT("long"), allowNull: false })
    declare row_data: string;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    declare created_at: Date;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    declare updated_at: Date;
}
