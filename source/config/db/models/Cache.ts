import { Column, DataType, Model, Table } from "sequelize-typescript";

interface ICache {
    key: string;
    value: string;
    expiration: number;
}

interface CacheCreationAttributes extends ICache {}

@Table({ tableName: "cache", timestamps: false })
export default class Cache extends Model<ICache, CacheCreationAttributes> {
    @Column({ type: DataType.STRING(255), allowNull: false })
    declare key: string;

    @Column({ type: DataType.TEXT("medium"), allowNull: false })
    declare value: string;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare expiration: number;
}
