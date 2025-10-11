import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IRoofPitch {
    id?: number;
    map_id: number;
    roof_ids?: string | null;
    custom_name?: string | null;
    roof_pitch: string;
    width?: string | null;
    cost_type: string;
    cost: number;
    is_default?: string | null;
    length?: number | null;
    percentage_of?: string | null;
}

interface RoofPitchCreationAttributes extends Omit<IRoofPitch, "id"> {}

@Table({ tableName: "roof_pitch", timestamps: false })
export default class RoofPitch extends Model<IRoofPitch, RoofPitchCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(100), allowNull: true, defaultValue: "1,2,3" })
    declare roof_ids?: string | null;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare custom_name?: string | null;

    @Column({ type: DataType.STRING(10), allowNull: false })
    declare roof_pitch: string;

    @Column({ type: DataType.STRING(10), allowNull: true })
    declare width?: string | null;

    @Column({ type: DataType.STRING(10), allowNull: false })
    declare cost_type: string;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;

    @Column({ type: DataType.STRING(10), allowNull: true, defaultValue: "no" })
    declare is_default?: string | null;

    @Column({ type: DataType.SMALLINT, allowNull: true })
    declare length?: number | null;

    @Column({ type: DataType.STRING(15), allowNull: true })
    declare percentage_of?: string | null;
}
