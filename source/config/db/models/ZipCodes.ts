import { Table, Column, Model, DataType, PrimaryKey } from "sequelize-typescript";

export interface IZipCodes {
    id: number;
    state_id: number;
    name: string;
}

interface ZipCodesCreationAttributes extends Omit<IZipCodes, "id"> {}

@Table({ tableName: "zip_codes", timestamps: false })
export default class ZipCodes extends Model<IZipCodes, ZipCodesCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare state_id: number;

    @Column({ type: DataType.STRING(155), allowNull: false })
    declare name: string;
}
