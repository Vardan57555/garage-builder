import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface ILongerBuilding {
    id: number;
    manufacturer_id: number;
    ft_type: number;
    length: number;
    height?: number;
    width?: number;
    type?: "length" | "height" | "width";
    rp_3_12?: number;
    rp_4_12?: number;
    rp_5_12?: number;
    rp_6_12?: number;
    combinations: string;
    group_id?: number | null;
    map_ids?: string | null;
}

interface LongerBuildingCreationAttributes extends Omit<ILongerBuilding, "id"> {}

@Table({ tableName: "longer_buildings", timestamps: false })
export default class LongerBuilding extends Model<ILongerBuilding, LongerBuildingCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare manufacturer_id: number;

    @Column({ type: DataType.TINYINT, allowNull: false })
    declare ft_type: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare length: number;

    @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
    declare height?: number;

    @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
    declare width?: number;

    @Column({ type: DataType.ENUM("length", "height", "width"), allowNull: true, defaultValue: "length" })
    declare type?: "length" | "height" | "width";

    @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0, comment: "Roof pitch 3/12" })
    declare rp_3_12?: number;

    @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0, comment: "Roof pitch 4/12" })
    declare rp_4_12?: number;

    @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0, comment: "Roof pitch 5/12" })
    declare rp_5_12?: number;

    @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0, comment: "Roof pitch 6/12" })
    declare rp_6_12?: number;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare combinations: string;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare group_id?: number | null;

    @Column({ type: DataType.STRING(1000), allowNull: true })
    declare map_ids?: string | null;
}
