import { IPaginationParams } from "@utils/pagination/app/io/IPagination";

export interface IDeleteBody
{
    id: string;
    deleteCount?: number;
}

export interface IById extends Partial<IPaginationParams>, Partial<ICommonParams>
{
    id: string;
    customer_id: string;
    company_id: string;
    location_id: string;
    user_id: string;
    reviewer_id: string;
    review_id: string;
    ngo_id: string;
    stripe_customer_id: string;
    heroboard_id: string;
    contract_id: string;
}

export interface ICommonParams
{
    locale: string;
    stripe_account: string;
    email: string;
}

export interface ICommonFetchParams
{
    ids?: string[];
}

export interface IMetricParams
{
    id: string;
    start_date: number;
    end_date: number;
}

export interface IOldestDate
{
    timestamp: number;
}
