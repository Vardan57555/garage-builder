import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    Default,
} from "sequelize-typescript";

export interface IFailedJobs {
    id?: bigint;
    uuid: string;
    connection: string;
    queue: string;
    payload: string;
    exception: string;
    failed_at?: Date;
}

interface FailedJobsCreationAttributes extends Omit<IFailedJobs, "id" | "failed_at"> {}

@Table({ tableName: "failed_jobs", timestamps: false })
export default class FailedJobs extends Model<IFailedJobs, FailedJobsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false })
    declare id: bigint;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare uuid: string;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare connection: string;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare queue: string;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare payload: string;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare exception: string;

    @Default(DataType.NOW)
    @Column({ type: DataType.DATE, allowNull: false })
    declare failed_at?: Date;
}
