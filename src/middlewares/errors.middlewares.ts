// file định nghĩa làm handler tổng
// nơi mà các lỗi từ toàn bộ hệ thống sẽ đỗ về đây
// lỗi từ validate đỗ về sẽ có lỗi 422 , mình có thể tận dụng
// đôi khi trong validate có lỗi đặc biệt , có dạng đặc biệt : ErrorWithStatus
// lỗi từ controller có thể là lỗi do mình ErrorWithStatus
// lỗi rớt mạng thì không có status

import {Request , Response , NextFunction} from 'express'
import { omit } from "lodash"
import HTTP_STATUS from "~/constants/httpStatus"
import { ErrorWithStatus } from '~/models/Errors'

// ==> lỗi từ các nơi đỗ về có thể có , hoặc không có status
export const defaultErrorHandle = (error : any, req : Request, res : Response , next : NextFunction) =>{
    // lỗi từ mọi nguồn đổ về đây
    // đc chia làm 2 dạng : ErrorWithStatus và phần còn lại
    if(error instanceof ErrorWithStatus){
        res.status(error.status).json(omit(error,[`status`]))
    }else{
        // khi error là lỗi còn lại
        // có nhiều thông tin lạ
        Object.getOwnPropertyNames(error).forEach((key) =>{
            Object.defineProperty(error,key,{enumerable : true})
        })
        // 
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message : error.message,
            errorInfo : omit(error,['stack'])
        })
    }
}