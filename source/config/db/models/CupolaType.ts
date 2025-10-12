import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface ICupolaType {
    id?: number;
    name: string;
    slug: string;
}

interface CupolaTypeCreationAttributes extends Omit<ICupolaType, "id"> {}

@Table({ tableName: "cupola_types", timestamps: false })
export default class CupolaType extends Model<ICupolaType, CupolaTypeCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare slug: string;
}
