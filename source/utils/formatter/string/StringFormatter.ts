import { createLogger } from "@utils/logger/Log";
import pino from "pino";

const logger: pino.Logger = createLogger(module);

export class StringFormatter
{
    /**
     * Parses a raw message string to JSON.
     *
     * @param {string} dataRaw - The raw message string.
     * @returns {Object|null} The parsed JSON object or null if parsing fails.
     */
    public static toJson(dataRaw: string): {} | null
    {
        try
        {
            return JSON.parse(dataRaw);
        }
        catch (err)
        {
            logger.error(`Failed to parse message as JSON: '${dataRaw}'`);

            return null;
        }
    }

    /**
     * Parses a raw message string to base64.
     *
     * @param {Buffer} data - The raw message string.
     * @returns {string|null} The parsed base64 string or null if parsing fails.
     */
    public static toBase64(data: Buffer): string
    {
        try
        {
            return data.toString("base64");
        }
        catch (err)
        {
            logger.error(`Failed to parse message as base64: '${data}'`);

            return null;
        }
    }
}
