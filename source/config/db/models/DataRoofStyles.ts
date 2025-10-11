import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataRoofStyles {
    id?: number;
    name: string;
}

interface DataRoofStylesCreationAttributes extends Omit<IDataRoofStyles, "id"> {}

@Table({ tableName: "data_roof_styles", timestamps: false })
export default class DataRoofStyles extends Model<IDataRoofStyles, DataRoofStylesCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare name: string;
}
