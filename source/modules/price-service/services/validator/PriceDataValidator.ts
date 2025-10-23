import joi, {ObjectSchema, ValidationResult} from "joi";
import {setupValidator} from "@utils/validator/SetupValidator";
import {Constants} from "@common/io/Constants";


export class PriceDataValidator
{
    /**
     * Schema for validating the output of a state.
     */
    public static outputSchema: ObjectSchema = joi.object().keys({
        state_id: joi.string().uuid({
            version: Constants.UUIDV4,
            separator: Constants.SEPARATOR
        }).required(),
        name: joi.string().required(),
        created_at: joi.number().required(),
        updated_at: joi.number().required()
    });


    /**
     * Schema for validating the output of a state attribute.
     */
    public static outputAttributesSchema: ObjectSchema = joi.object().keys({
        state_id: joi.string().uuid({
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
        data: joi.array().items(PriceDataValidator.outputSchema).required(),
    });

    /**
     * Validates the output of a state.
     *
     * @param data - The data to validate.
     * @returns The validation result.
     */
    public static outputValidate(data: {}): ValidationResult
    {
        return setupValidator(data, PriceDataValidator.outputSchema);
    }

    /**
     * Validates the output of the list of state.
     *
     * @param data - The data to validate.
     * @returns The validation result.
     */
    public static outputArrayValidate(data: {}): ValidationResult
    {
        return setupValidator(data, PriceDataValidator.outputItemSchema);
    }
}
