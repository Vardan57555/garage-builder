import { ValidationTargets } from "@common/io/enum/ValidationTargets";
import { ValidationError } from "@errors/ValidationError";
import { NextFunction, Request, Response } from "express";
import { ValidationResult } from "joi";

/**
 * Creates a validation middleware using a given validator function.
 *
 * @param validator - A validation function that takes request body and returns a ValidationResult object.
 * @param target - The target object to validate.
 * @returns {Function} Express middleware function.
 */
export function validate(validator: () => ValidationResult, target: ValidationTargets): (req: Request, res: Response, next: NextFunction) => void
{
    return (req: Request, _res: Response, next: NextFunction): void =>
    {
        const validation: ValidationResult = validator();

        if (validation.error)
        {
            return next(new ValidationError(ValidationError.INPUT, validation.error.message));
        }

        req[target] = validation.value;

        next();
    };
}

