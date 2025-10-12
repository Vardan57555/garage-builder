import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table, CreatedAt, UpdatedAt } from "sequelize-typescript";

export interface IDataSidesEnds {
    id?: number;
    manufacturer_id: number;
    region_id: number;
    building_id: number;
    side_closed_rows?: string;
    end_closed_rows?: string;
    extra_panels_rows?: string;
    gable_ends_rows?: string;
    wainscot_rows?: string;
    created_at?: Date;
    updated_at?: Date;
}

interface DataSidesEndsCreationAttributes extends Omit<IDataSidesEnds, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "data_sides_ends", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" })
export default class DataSidesEnds extends Model<IDataSidesEnds, DataSidesEndsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare manufacturer_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare region_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare building_id: number;

    @Column({ type: DataType.TEXT })
    declare side_closed_rows?: string;

    @Column({ type: DataType.TEXT })
    declare end_closed_rows?: string;

    @Column({ type: DataType.TEXT })
    declare extra_panels_rows?: string;

    @Column({ type: DataType.TEXT })
    declare gable_ends_rows?: string;

    @Column({ type: DataType.TEXT })
    declare wainscot_rows?: string;

    @CreatedAt
    @Column({ field: "created_at", type: DataType.DATE })
    declare created_at: Date;

    @UpdatedAt
    @Column({ field: "updated_at", type: DataType.DATE })
    declare updated_at: Date;
}
