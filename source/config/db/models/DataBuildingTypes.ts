import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataBuildingTypes {
    id?: number;
    name: string;
    title: string;
}

interface DataBuildingTypesCreationAttributes extends Omit<IDataBuildingTypes, "id"> {}

@Table({ tableName: "data_building_types", timestamps: false })
export default class DataBuildingTypes extends Model<IDataBuildingTypes, DataBuildingTypesCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare title: string;
}
