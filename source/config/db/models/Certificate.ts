import { Column, DataType, Model, Table, PrimaryKey, AutoIncrement } from "sequelize-typescript";

export interface ICertificate {
    id?: number;
    certificate_id: number;
    name: string;
    gauge: number;
    certified: boolean;
    distance_on_center?: number;
    map_id: number;
    is_default?: string;
    surface?: number;
    min_width?: number;
    max_width?: number;
    percentage_of_cost?: number;
    percentage_of?: "building_amount" | "base_price" | "dealer_deposit" | "base_height_price";
    created_at?: Date;
    updated_at?: Date;
}

interface CertificateCreationAttributes extends Omit<ICertificate, "id"> {}

@Table({ tableName: "certificate", timestamps: false })
export default class Certificate extends Model<ICertificate, CertificateCreationAttributes> {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number; // <-- primary key

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare certificate_id: number; // <-- business ID

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare name: string;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare gauge: number;

    @Column({ type: DataType.BOOLEAN, allowNull: false })
    declare certified: boolean;

    @Column({ type: DataType.FLOAT(10, 2), allowNull: true, defaultValue: 0.0 })
    declare distance_on_center: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(5), allowNull: true, defaultValue: "no" })
    declare is_default: string;

    @Column({ type: DataType.TINYINT, allowNull: true, defaultValue: 1, comment: "concrete 1 ground 2 all 3" })
    declare surface: number;

    @Column({ type: DataType.SMALLINT, allowNull: true, defaultValue: 0 })
    declare min_width: number;

    @Column({ type: DataType.SMALLINT, allowNull: true, defaultValue: 0 })
    declare max_width: number;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare percentage_of_cost: number;

    @Column({
        type: DataType.ENUM('building_amount','base_price','dealer_deposit','base_height_price'),
        allowNull: true
    })
    declare percentage_of: "building_amount" | "base_price" | "dealer_deposit" | "base_height_price";

    @Column({ type: DataType.DATE, allowNull: false })
    declare created_at: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at: Date;
}
