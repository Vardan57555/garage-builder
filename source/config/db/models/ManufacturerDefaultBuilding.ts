import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IManufacturerDefaultBuilding {
    id: number;
    name?: string | null;
    is_breezeway_building: boolean;
    image_name?: string | null;
    region_id?: string | null;
    state_ids?: string | null;
    other_building_id?: string | null;
    building_id?: number | null;
    roof_id?: number | null;
    size?: string | null;
    wall?: string | null;
    utility?: number | null;
    utility_front: number;
    leanto?: string | null;
    leanto_size?: string | null;
    leanto_wall?: string | null;
    manufacturer_id?: number | null;
    roof_color: number;
    trim_color: number;
    wall_color: number;
    wainscot_color: number;
    default_doors?: string | null;
    leanto_data?: string | null;
    central_roof_pitch?: string | null;
    leanto_roof_pitch?: string | null;
}

interface ManufacturerDefaultBuildingCreationAttributes
    extends Omit<IManufacturerDefaultBuilding, "id"> {}

@Table({ tableName: "manufacturer_default_buildings", timestamps: false })
export default class ManufacturerDefaultBuilding extends Model<
    IManufacturerDefaultBuilding,
    ManufacturerDefaultBuildingCreationAttributes
> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare name?: string | null;

    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 0 })
    declare is_breezeway_building: boolean;

    @Column({ type: DataType.STRING(250), allowNull: true })
    declare image_name?: string | null;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare region_id?: string | null;

    @Column({ type: DataType.STRING(250), allowNull: true })
    declare state_ids?: string | null;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare other_building_id?: string | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare building_id?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare roof_id?: number | null;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare size?: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare wall?: string | null;

    @Column({ type: DataType.SMALLINT, allowNull: true })
    declare utility?: number | null;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare utility_front: number;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare leanto?: string | null;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare leanto_size?: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare leanto_wall?: string | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare manufacturer_id?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
    declare roof_color: number;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
    declare trim_color: number;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
    declare wall_color: number;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    declare wainscot_color: number;

    @Column({ type: DataType.STRING(2048), allowNull: true })
    declare default_doors?: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare leanto_data?: string | null;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare central_roof_pitch?: string | null;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare leanto_roof_pitch?: string | null;
}
