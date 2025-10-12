export interface IAuthorizedData
{
    verified_user_id?: string;
    login_type?: string;
    username?: string;
    isTest?: boolean;
    granted_all?: string[];
    granted_self?: string[];
}
