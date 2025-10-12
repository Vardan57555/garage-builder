import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataCertificatePrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    min_height?: number;
    max_height?: number;
    min_length?: number;
    max_length?: number;
    distance_on_length?: number;
    certificate_price_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataCertificatePriceCreationAttributes extends Omit<IDataCertificatePrice, "id"> {}

@Table({ tableName: "data_certificate_price", timestamps: false })
export default class DataCertificatePrice extends Model<IDataCertificatePrice, DataCertificatePriceCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare manufacturer_id?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare region_id?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare building_id?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_height?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_height?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_length?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_length?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare distance_on_length?: number;

    @Column({ type: DataType.BLOB, allowNull: true })
    declare certificate_price_row?: Buffer;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
