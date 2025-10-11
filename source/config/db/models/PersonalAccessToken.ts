import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    CreatedAt,
    UpdatedAt,
} from "sequelize-typescript";

export interface IPersonalAccessToken {
    id?: number;
    tokenable_type: string;
    tokenable_id: number;
    name: string;
    token: string;
    abilities?: string | null;
    last_used_at?: Date | null;
    expires_at?: Date | null;
    created_at?: Date | null;
    updated_at?: Date | null;
}

interface PersonalAccessTokenCreationAttributes
    extends Omit<IPersonalAccessToken, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "personal_access_tokens", timestamps: true })
export default class PersonalAccessToken extends Model<
    IPersonalAccessToken,
    PersonalAccessTokenCreationAttributes
> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare tokenable_type: string;

    @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false })
    declare tokenable_id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(64), allowNull: false })
    declare token: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare abilities?: string | null;

    @Column({ type: DataType.DATE, allowNull: true })
    declare last_used_at?: Date | null;

    @Column({ type: DataType.DATE, allowNull: true })
    declare expires_at?: Date | null;

    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date | null;

    @UpdatedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date | null;
}
