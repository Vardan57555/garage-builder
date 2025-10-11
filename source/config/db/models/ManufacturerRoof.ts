import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IManufacturerRoof {
    id: number;
    roof_id?: number | null;
    roof_name?: string | null;
    manufacturer_id?: number | null;
}

interface ManufacturerRoofCreationAttributes
    extends Omit<IManufacturerRoof, "id"> {}

@Table({ tableName: "manufacturer_roofs", timestamps: false })
export default class ManufacturerRoof extends Model<
    IManufacturerRoof,
    ManufacturerRoofCreationAttributes
> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare roof_id?: number | null;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare roof_name?: string | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare manufacturer_id?: number | null;
}
