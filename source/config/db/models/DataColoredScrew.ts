import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataColoredScrew {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    colored_screw_data?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataColoredScrewCreationAttributes extends Omit<IDataColoredScrew, "id"> {}

@Table({ tableName: "data_colored_screw", timestamps: false })
export default class DataColoredScrew extends Model<IDataColoredScrew, DataColoredScrewCreationAttributes> {
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

    @Column({ type: DataType.TEXT("long"), allowNull: true })
    declare colored_screw_data?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
