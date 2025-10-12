import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IManufacturerRegion {
    id: number;
    region_name?: string | null;
    state_ids?: string | null;
    manufacturer_id?: number | null;
}

interface ManufacturerRegionCreationAttributes
    extends Omit<IManufacturerRegion, "id"> {}

@Table({ tableName: "manufacturer_regions", timestamps: false })
export default class ManufacturerRegion extends Model<
    IManufacturerRegion,
    ManufacturerRegionCreationAttributes
> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare region_name?: string | null;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare state_ids?: string | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare manufacturer_id?: number | null;
}
