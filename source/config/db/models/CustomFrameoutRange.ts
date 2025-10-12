import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface ICustomFrameoutRange {
    id?: number;
    map_id: number;
    type: 'garage_door_frame_outs';
    row_data: string;
}

interface CustomFrameoutRangeCreationAttributes extends Omit<ICustomFrameoutRange, "id"> {}

@Table({ tableName: "custom_frameout_range", timestamps: false })
export default class CustomFrameoutRange extends Model<ICustomFrameoutRange, CustomFrameoutRangeCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.ENUM('garage_door_frame_outs'), allowNull: false })
    declare type: 'garage_door_frame_outs';

    @Column({ type: DataType.STRING(1000), allowNull: false })
    declare row_data: string;
}
