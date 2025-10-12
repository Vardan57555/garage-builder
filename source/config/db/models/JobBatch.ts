import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IJobBatch {
    id: string;
    name: string;
    total_jobs: number;
    pending_jobs: number;
    failed_jobs: number;
    failed_job_ids: string;
    options?: string | null;
    cancelled_at?: number | null;
    created_at: number;
    finished_at?: number | null;
}

interface JobBatchCreationAttributes extends Omit<IJobBatch, "id" | "created_at"> {}

@Table({ tableName: "job_batches", timestamps: false })
export default class JobBatch extends Model<IJobBatch, JobBatchCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.STRING(255), allowNull: false })
    declare id: string;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare name: string;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare total_jobs: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare pending_jobs: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare failed_jobs: number;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare failed_job_ids: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare options?: string | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare cancelled_at?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare created_at: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare finished_at?: number | null;
}
