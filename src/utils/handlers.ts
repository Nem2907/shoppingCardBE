import {Request , Response , NextFunction , RequestHandler} from 'express'
// viết hàm wrapAsync 
// là hàm nhận vào requestHandler bao gồm middleware và controller
// 'req handler' này không có cấu trúc try catch next
// wrapAsync sẽ nhận và trả 1 req handler khác
// đc tạo từ try catch next và req handler ban đầu
// hay con gọi là hàm nhận vào 1 hàm ko cần try catch 
// và biến nó thành try catch
// p : param
// t : requestQuery
// genertic : độ lại những thư viện để sài
export const  wrapAsync = <P,T>(func : RequestHandler<P,any,any,T>)=>{
    // đưa func và nhận đc req handler mới
    return async(req : Request<P,any,any,T> , res:Response ,next :NextFunction) =>{
        try {
            await func(req,res,next)
        } catch (error) {
            next(error)
        }
    }
    // đưa cho t cái hàm , và t sẽ chạy cái hàm của m trong try-catch của t 
}