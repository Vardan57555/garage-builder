import joi, {ObjectSchema, ValidationResult} from "joi";
import {setupValidator} from "@utils/validator/SetupValidator";
import {Constants} from "@common/io/Constants";


export class StateDataValidator
{
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
        state_id: joi.string().uuid({
            version: Constants.UUIDV4,
            separator: Constants.SEPARATOR
        }).required(),
        name: joi.string().required(),
        created_at: joi.number().required(),
        updated_at: joi.number().required()
    });

    /**
     * Schema for validating the output of a bulk region.
     */
    private static outputItemSchema: ObjectSchema = joi.object({
        data: joi.array().items(StateDataValidator.outputSchema).required(),
    });

    /**
     * Validates the output after get state by manufacturer id.
     *
     * @param data - The data to validate.
     * @returns The validation result.
     */
    public static validateFetchByIdRequestBody(data: {}): ValidationResult
    {
        return setupValidator(data, StateDataValidator.fetchByIdRequestBodySchema);
    }

    /**
     * Validates the output of a state.
     *
     * @param data - The data to validate.
     * @returns The validation result.
     */
    public static outputValidate(data: {}): ValidationResult
    {
        return setupValidator(data, StateDataValidator.outputSchema);
    }

    /**
     * Validates the output of the list of state.
     *
     * @param data - The data to validate.
     * @returns The validation result.
     */
    public static outputArrayValidate(data: {}): ValidationResult
    {
        return setupValidator(data, StateDataValidator.outputItemSchema);
    }
}
