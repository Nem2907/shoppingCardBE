import { ValidationChain, validationResult } from "express-validator";
import { RunnableValidationChains } from "express-validator/lib/middlewares/schema";
import { Request , Response , NextFunction } from "express";
import { EntityError, ErrorWithStatus } from "~/models/Errors";
import HTTP_STATUS from "~/constants/httpStatus";

//hàm validate sẽ nhận vào checkShema và trả ra các middleware xử lý lỗi
export const validate = (valuedation : RunnableValidationChains<ValidationChain>) => {
//khi m chạy thì mới nhận đc validationChain(Runnable)
    return async (req : Request,res :Response ,next : NextFunction) =>{
        // ở đây có await , async do hàm run là promise ==> 
        await valuedation.run(req)//tạo danh sách lỗi cất vào req
        const errors = validationResult(req)// lấy danh sách lỗi trong req dưới dạng mảng
        if(errors.isEmpty()){
            return next()
        }else{
            const errorsObject = errors.mapped();//danh sách các lỗi dạng object
            const entityError = new EntityError({errors : {},})//đây là object lỗi mà mình muốn thay thế
            // duyệt key
            for (const key in errorsObject) {
                // lấy msg trong từng trường dữ liệu của errorObject
                const {msg} = errorsObject[key]
                // nếu msg có dạng ErrorWithStatus và có status khác 422 thì mình next(err) nó ra trước
                if(msg instanceof ErrorWithStatus && msg.status != HTTP_STATUS.UNPROCESSABLE_ENTITY){
                    return next()
                }
                //nếu không phải dạng đặc biệt thì mình bỏ vào entityError
                entityError.errors[key] = msg
            }
            next(entityError)
        }
    }
}