import { Table, Column, Model, DataType, PrimaryKey } from "sequelize-typescript";

export interface ISession {
    id: string;
    user_id?: number | null;
    ip_address?: string | null;
    user_agent?: string | null;
    payload: string;
    last_activity: number;
}

interface SessionCreationAttributes extends Omit<ISession, "id"> {}

@Table({ tableName: "sessions", timestamps: false })
export default class Session extends Model<ISession, SessionCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.STRING(255), allowNull: false })
    declare id: string;

    @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
    declare user_id?: number | null;

    @Column({ type: DataType.STRING(45), allowNull: true })
    declare ip_address?: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare user_agent?: string | null;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare payload: string;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare last_activity: number;
}
