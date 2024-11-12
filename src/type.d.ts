// đây là file có hiệu lực mạnh nhất,   
import { Request } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import { TokenPayload } from "./models/schemas/requests/users.requests";
declare module 'express'{
    interface Request{
        decode_authorization? : TokenPayload
        decode_refresh_token? : TokenPayload
        decode_email_verify_token? : TokenPayload
        decode_forgot_password_token? : TokenPayload
    }
}