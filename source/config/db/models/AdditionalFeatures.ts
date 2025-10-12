import { Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";

export interface IAdditionalFeatures {
    id?: number;
    map_id: number;
    additional_feature: string;
    cost_type: string;
    cost: number;
    percentage_of?: string;
    is_cumulative: boolean;
    feature_type: 'additional_feature' | 'parts_drop_off';
    is_outside_extra_item: boolean;
    created_at?: number;
    updated_at?: number;
}

interface AdditionalFeaturesCreationAttributes extends Omit<IAdditionalFeatures, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "additional_features", timestamps: false })
export default class AdditionalFeatures extends Model<IAdditionalFeatures, AdditionalFeaturesCreationAttributes> {

    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare additional_feature: string;

    @Column({ type: DataType.STRING(10), allowNull: false })
    declare cost_type: string;

    @Default(0)
    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;

    @Column({ type: DataType.STRING(15), allowNull: true, comment: '1 => Total Building Amount 2 => Base Price 3 => Wall Price' })
    declare percentage_of?: string;

    @Default(false)
    @Column({ type: DataType.BOOLEAN, allowNull: false })
    declare is_cumulative: boolean;

    @Default('additional_feature')
    @Column({ type: DataType.ENUM('additional_feature', 'parts_drop_off'), allowNull: false })
    declare feature_type: 'additional_feature' | 'parts_drop_off';

    @Default(false)
    @Column({ type: DataType.BOOLEAN, allowNull: false, comment: '0:hide,1:show' })
    declare is_outside_extra_item: boolean;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare created_at: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare updated_at: number;
}
