import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IInstallationFees {
    id?: number;
    map_id: number;
    start_width?: number;
    end_width?: number;
    start_length?: number;
    end_length?: number;
    start_height?: number;
    end_height?: number;
    end_wall?: number;
    is_end_wall?: "yes" | "no" | "included";
    side_wall?: number;
    is_side_wall?: "yes" | "no" | "included";
    type: "garage_door" | "walkin_door" | "window";
}

interface InstallationFeesCreationAttributes
    extends Omit<IInstallationFees, "id"> {}

@Table({ tableName: "installation_fees", timestamps: false })
export default class InstallationFees extends Model<IInstallationFees, InstallationFeesCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare start_width?: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare end_width?: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare start_length?: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare end_length?: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare start_height?: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare end_height?: number;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 })
    declare end_wall?: number;

    @Column({ type: DataType.ENUM("yes", "no", "included"), allowNull: false, defaultValue: "no" })
    declare is_end_wall?: "yes" | "no" | "included";

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 })
    declare side_wall?: number;

    @Column({ type: DataType.ENUM("yes", "no", "included"), allowNull: false, defaultValue: "no" })
    declare is_side_wall?: "yes" | "no" | "included";

    @Column({ type: DataType.ENUM("garage_door", "walkin_door", "window"), allowNull: false })
    declare type: "garage_door" | "walkin_door" | "window";
}
