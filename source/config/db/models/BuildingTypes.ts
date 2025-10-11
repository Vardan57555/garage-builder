import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

interface IBuildingTypes {
    id?: number;
    name: string;
    title: string;
    manu_1?: string;
    manu_2?: string;
    manu_3?: string;
    manu_4?: string;
    manu_5?: string;
    manu_6?: string;
    manu_7?: string;
    manu_8?: string;
    manu_9?: string;
    manu_10?: string;
    manu_11?: string;
    manu_12?: string;
    manu_13?: string;
    manu_14?: string;
    manu_15?: string;
    manu_16?: string;
    manu_17?: string;
    created_at?: number;
    updated_at?: number;
}

interface BuildingTypesCreationAttributes extends Omit<IBuildingTypes, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "building_types", timestamps: false })
export default class BuildingTypes extends Model<IBuildingTypes, BuildingTypesCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare title: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_1: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_2: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_3: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_4: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_5: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_6: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_7: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_8: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_9: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_10: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare manu_11: string;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_12: string;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_13: string;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_14: string;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_15: string;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_16: string;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_17: string;

    @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: () => Date.now() })
    declare created_at: number;

    @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: () => Date.now() })
    declare updated_at: number;
}
