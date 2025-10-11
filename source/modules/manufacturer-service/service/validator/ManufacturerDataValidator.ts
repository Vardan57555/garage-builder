import joi, {ObjectSchema, ValidationResult} from "joi";
import {setupValidator} from "@utils/validator/SetupValidator";
import {Constants} from "@common/io/Constants";


export class ManufacturerDataValidator
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
     * Schema for validating the request body of get state by manufacturer id.
     */
    private static fetchByIdRequestBodySchema: ObjectSchema = joi.object().keys({
        id: joi.string().max(Constants.MAX_STRING_LENGTH).uuid({
            version: Constants.UUIDV4,
            separator: Constants.SEPARATOR
        }).required()
    });

    /**
     * Schema for validating the output of a state.
     */
    public static outputSchema: ObjectSchema = joi.object().keys({
        manufacturer_id: joi.string().uuid({
            version: Constants.UUIDV4,
            separator: Constants.SEPARATOR
        }).required(),
        created_at: joi.number().required(),
        updated_at: joi.number().required()
    });


    /**
     * Schema for validating the output of a state attribute.
     */
    public static outputAttributesSchema: ObjectSchema = joi.object().keys({
        manufacturer_id: joi.string().uuid({
            version: Constants.UUIDV4,
            separator: Constants.SEPARATOR
        }).allow(Constants.NULL, Constants.EMPTY_STRING),
        name: joi.string().allow(Constants.NULL, Constants.EMPTY_STRING),
        created_at: joi.number().allow(Constants.NULL, Constants.EMPTY_STRING),
        updated_at: joi.number().allow(Constants.NULL, Constants.EMPTY_STRING)
    });

    /**
     * Schema for validating the output of a bulk region.
     */
    private static outputItemSchema: ObjectSchema = joi.object({
        data: joi.array().items(ManufacturerDataValidator.outputSchema).required(),
    });

    /**
     * Validates the state and manufacturer ids in the request params.
     *
     * @param data - The data to validate.
     * @returns The validation result.
     */
    public static validateFetchByStateAndManufacturerIdsSchema(data: {}): ValidationResult
    {
        return setupValidator(data, ManufacturerDataValidator.fetchByStateAndManufacturerIdsSchema)
    }

    /**
     * Validates the output after get state by manufacturer id.
     *
     * @param data - The data to validate.
     * @returns The validation result.
     */
    public static validateFetchByIdRequestBody(data: {}): ValidationResult
    {
        return setupValidator(data, ManufacturerDataValidator.fetchByIdRequestBodySchema);
    }

    /**
     * Validates the output of a state.
     *
     * @param data - The data to validate.
     * @returns The validation result.
     */
    public static outputValidate(data: {}): ValidationResult
    {
        return setupValidator(data, ManufacturerDataValidator.outputSchema);
    }

    /**
     * Validates the output of the list of state.
     *
     * @param data - The data to validate.
     * @returns The validation result.
     */
    public static outputArrayValidate(data: {}): ValidationResult
    {
        return setupValidator(data, ManufacturerDataValidator.outputItemSchema);
    }
}
