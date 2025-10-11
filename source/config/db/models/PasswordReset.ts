import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    CreatedAt,
} from "sequelize-typescript";

export interface IPasswordReset {
    email: string;
    token: string;
    created_at?: Date | null;
}

interface PasswordResetCreationAttributes extends IPasswordReset {}

@Table({ tableName: "password_resets", timestamps: false })
export default class PasswordReset extends Model<IPasswordReset, PasswordResetCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.STRING(191), allowNull: false })
    declare email: string;

    @Column({ type: DataType.STRING(191), allowNull: false })
    declare token: string;

    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: true, defaultValue: DataType.NOW })
    declare created_at?: Date | null;
}
