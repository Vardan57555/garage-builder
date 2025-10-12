import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IManufacturerBuilding {
    id: number;
    building_id?: number | null;
    building_name?: string | null;
    building_type?: number | null;
    manufacturer_id?: number | null;
    roof_ids?: string | null;
}

interface ManufacturerBuildingCreationAttributes extends Omit<IManufacturerBuilding, "id"> {}

@Table({ tableName: "manufacturer_buildings", timestamps: false })
export default class ManufacturerBuilding extends Model<IManufacturerBuilding, ManufacturerBuildingCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare building_id?: number | null;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare building_name?: string | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare building_type?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare manufacturer_id?: number | null;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare roof_ids?: string | null;
}
