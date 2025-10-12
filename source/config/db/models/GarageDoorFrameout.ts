import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IGarageDoorFrameout {
    id?: number;
    map_id?: number | null;
    is_fixed?: number | null;
    is_custom_size?: boolean;
    on_end?: number | null;
    on_side?: number | null;
    dutch_cost?: number | null;
    height?: number | null;
    frame_out_length?: string | null;
    frame_out_height?: string | null;
    building_height?: string | null;
    building_width?: string | null;
    building_length?: string | null;
    dutch_cost_side?: number | null;
    is_header_bar?: boolean;
    header_bar?: number | null;
    end_clearance?: number | null;
    side_clearance?: number | null;
    legs_type?: string | null;
}

interface GarageDoorFrameoutCreationAttributes extends Omit<IGarageDoorFrameout, "id"> {}

@Table({ tableName: "garage_door_frameout", timestamps: false })
export default class GarageDoorFrameout extends Model<IGarageDoorFrameout, GarageDoorFrameoutCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare map_id?: number | null;

    @Column({ type: DataType.SMALLINT, allowNull: true })
    declare is_fixed?: number | null;

    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 0 })
    declare is_custom_size?: boolean;

    @Column({ type: DataType.FLOAT, allowNull: true })
    declare on_end?: number | null;

    @Column({ type: DataType.FLOAT, allowNull: true })
    declare on_side?: number | null;

    @Column({ type: DataType.FLOAT, allowNull: true })
    declare dutch_cost?: number | null;

    @Column({ type: DataType.SMALLINT, allowNull: true })
    declare height?: number | null;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare frame_out_length?: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare frame_out_height?: string | null;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare building_height?: string | null;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare building_width?: string | null;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare building_length?: string | null;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare dutch_cost_side?: number | null;

    @Column({ type: DataType.TINYINT, allowNull: true, defaultValue: 0 })
    declare is_header_bar?: boolean;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare header_bar?: number | null;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare end_clearance?: number | null;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare side_clearance?: number | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare legs_type?: string | null;
}
