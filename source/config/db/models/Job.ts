import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IJob {
    id?: bigint;
    queue: string;
    payload: string;
    attempts: number;
    reserved_at?: number | null;
    available_at: number;
    created_at: number;
}

interface JobCreationAttributes extends Omit<IJob, "id"> {}

@Table({ tableName: "jobs", timestamps: false })
export default class Job extends Model<IJob, JobCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false })
    declare id: bigint;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare queue: string;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare payload: string;

    @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false })
    declare attempts: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare reserved_at?: number | null;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare available_at: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare created_at: number;
}
