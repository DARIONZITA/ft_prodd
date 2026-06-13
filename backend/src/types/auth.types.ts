import { IntraUser } from '../validations/auth';

export interface ApiUser
{
    id: number;
    username: string;
    email: string;
    avatarUrl: string;
    fortyTwoId: number | null;
}

export class OauthCallbackResult
{
    public readonly success : boolean;
    public readonly httpCode : number;
    public readonly message : string;
    public readonly token? : string;
    public readonly intraUser? : IntraUser;
    public readonly user? : ApiUser;

    constructor(httpCode : number, message : string, token? : string, intraUser? : IntraUser, user? : ApiUser )
    {
        this.success = httpCode >= 200 && httpCode < 300;
        this.httpCode = httpCode;
        this.message = message;
        this.token = token;
        this.intraUser = intraUser;
        this.user = user;
    }
}