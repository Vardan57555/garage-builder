import joi, {ObjectSchema, ValidationResult} from "joi";
import {setupValidator} from "@utils/validator/SetupValidator";


export class BuildingDataValidator
{

    /**
     * Schema for validating the request body of get company by state and manufacturer ids.
     */

    private static fetchByStateAndManufacturerIdsSchema: ObjectSchema = joi.object().keys({
        state_id: joi.string().required(),
        manufacturer_id: joi.string().required(),
        state_check: joi.boolean().default(false)
    })


    /**
     * Validates the state and manufacturer ids in the request params.
     *
     * @param data - The data to validate.
     * @returns The validation result.
     */
    public static validateFetchByStateAndManufacturerIdsSchema(data: {}): ValidationResult
    {
        return setupValidator(data, BuildingDataValidator.fetchByStateAndManufacturerIdsSchema)
    }

}
