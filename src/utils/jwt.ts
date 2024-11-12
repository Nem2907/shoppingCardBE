import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { error } from 'console'
import { TokenPayload } from '~/models/schemas/requests/users.requests'
dotenv.config()
// file này , chứa hàm dùng để tạo ra token bằng con nghệ jwt
// hàm chỉ tạo ra token chứ không phải tạo ra accesstoken hay refreshtoken

export const signToken = ({
    payload,
    privateKey,
    options = {algorithm: 'HS256'}
}: {
    payload : string | object | Buffer  
    privateKey: string 
    options? : jwt.SignOptions
}) => {
    return new Promise<string>((resolve,reject) => {
        jwt.sign(payload ,privateKey , options ,(error,token)=>{
            if(error) throw reject(error)
            else return resolve(token as string)
        })
    })
}
// hàm kiểm tra token có khớp chữ ký không và trả về payload của token đó
export const verifyToken = ({token,privateKey} : {token : string , privateKey: string}) => {
    return new Promise<TokenPayload>((resolve,reject) =>{
        jwt.verify(token,privateKey,(error,decode)=>{
            if(error) throw reject(error)
            else return resolve(decode as TokenPayload)
        })
    })
}
