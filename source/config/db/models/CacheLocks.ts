import { Column, DataType, Model, Table } from "sequelize-typescript";

interface ICacheLock {
    key: string;
    owner: string;
    expiration: number;
}

interface CacheLockCreationAttributes extends ICacheLock {}

@Table({ tableName: "cache_locks", timestamps: false })
export default class CacheLock extends Model<ICacheLock, CacheLockCreationAttributes> {
    @Column({ type: DataType.STRING(255), allowNull: false })
    declare key: string;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare owner: string;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare expiration: number;
}
