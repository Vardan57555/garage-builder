import {
    IServiceData
} from "@modules/auth-service/authorization/authorize/io/IVerifiedRequest";
import { Request } from "express";
import { IAuthorizedData } from "./io/IAuthorizedData";

export interface CustomRequest extends Request
{
    service_data?: IServiceData;
    authorize_data?: IAuthorizedData;
    token: string;
}

export interface RequestSource
{
    ip?: string;
    host?: string;
    origin?: string;
    userAgent?: string;
    authorization?: string;
    location?: RequestLocation;
    connection?: string;
    site_id?: string;
}

export interface RequestLocation
{
    code?: string;
    country?: string;
}
