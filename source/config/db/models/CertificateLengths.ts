import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface ICertificateLength {
    id?: number;
    certificate_id: number;
    map_id: number;
    length: number;
    height: number;
    certification_concrete_cost?: number;
    cost?: number;
    has_double_leg?: boolean;
    has_ladder_leg?: boolean;
    has_other_leg?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface CertificateLengthCreationAttributes extends Omit<ICertificateLength, "certificate_length_id"> {}

@Table({ tableName: "certificate_lengths", timestamps: false })
export default class CertificateLength extends Model<ICertificateLength, CertificateLengthCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare certificate_id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare length: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare height: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare certification_concrete_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare cost: number;

    @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare has_double_leg: boolean;

    @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare has_ladder_leg: boolean;

    @Column({ type: DataType.TINYINT, allowNull: true, defaultValue: 0 })
    declare has_other_leg: boolean;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    declare created_at: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at: Date;
}
