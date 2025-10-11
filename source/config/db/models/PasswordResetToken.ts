import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    CreatedAt,
} from "sequelize-typescript";

export interface IPasswordResetToken {
    email: string;
    token: string;
    created_at?: Date | null;
}

interface PasswordResetTokenCreationAttributes extends IPasswordResetToken {}

@Table({ tableName: "password_reset_tokens", timestamps: false })
export default class PasswordResetToken extends Model<IPasswordResetToken, PasswordResetTokenCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.STRING(255), allowNull: false })
    declare email: string;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare token: string;

    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date | null;
}
