// controller là handler có nhiệm vụ xử lý logic
// các thông tin khi đã vào controller thì clean

import { Request , Response } from "express"
import { ChangePasswordReqBody, ForgetPasswordReqBody, LoginReqBody, LogoutReqBody, RefreshTokenReqBody, RegisterReqBody, ResetPasswordReqBody, TokenPayload, UpdateMeReqBody, VerifyEmailReqQuery, VerifyForgotPasswordTokenReqBody } from "~/models/schemas/requests/users.requests"
import User from "~/models/schemas/User.schema"
import databaseServices from "~/services/database.services"
import usersServices from "~/services/users.services"
import {NextFunction, ParamsDictionary} from "express-serve-static-core"
import { ErrorWithStatus } from "~/models/Errors"
import HTTP_STATUS from "~/constants/httpStatus"
import { USERS_MESSAGES } from "~/constants/messages"
import { UserVerifyStatus } from "~/constants/enums"

// export const loginController = (req:Request,res:Response) =>{
//     // vào đây là ko kiểm tra dữ liệu nữa
//     // chỉ cần dùng mà thôi
//     const {email , password} = req.body
//     // vào database kiểm tra đúng hay không?
//     // xà lơ
//     if(email =="hoangnamlongho@gmail.com" && password == "NKC280824chi"){
//         res.status(200).json({
//             message : 'Login success',
//             data : {
//                 fname : "Điệp",
//                 age : 1999 
//             }
//         })
//     }else{
//         res.status(400).json({
//             message : 'invalid email or password'
//         })
//     }
// }
// registerController nhận vào thông tin đăng ký của người dùng
// và vào database để tạo user mới lưu vào
export const registerController = async (req:Request<ParamsDictionary,any,RegisterReqBody>,res:Response,next : NextFunction) =>{
    const {email} = req.body
    // vào data và nhét vào collection users
    
        // throw new Error('Lỗi mất mạng')
        // kiểm tra email có tồn tại chưa | có ai dùng email này chưa
        // | email có bị trùng không ?
        const isDup = await usersServices.checkEmailExist(email);
        if(isDup){
            throw new ErrorWithStatus({
                status : HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
                message : USERS_MESSAGES.EMAIL_ALREADY_EXISTS
            })
        }
        const result = await usersServices.register(req.body)
        res.status(201).json({
            message : USERS_MESSAGES.REGISTER_SUCCESS,
            data : result
        })
}
export const loginController = async (req : Request<ParamsDictionary,any,LoginReqBody>,
                                        res:Response , 
                                        next:NextFunction) => {
// dùng email và password để tìm user đang sỡ hữu chúng
// nếu có user đó tồn tại nghĩa là đăng nhập thành công
    const {email , password} = req.body
    // vào database tìm
    const result = await usersServices.login({email,password})
    // 
    res.status(HTTP_STATUS.OK).json({
        message : USERS_MESSAGES.LOGIN_SUCCESS,
        result // là access và refresh 
    })
}
export const logoutController = async (req:Request<ParamsDictionary,any,LogoutReqBody>,res:Response,next:NextFunction) =>{
    const {refresh_token} = req.body
    // so với user_id trong payload của ac và rf có phải là 1 không?
    const{user_id : user_id_at} = req.decode_authorization as TokenPayload
    const{user_id : user_id_rf} = req.decode_refresh_token as TokenPayload
    if(user_id_at != user_id_rf){
        throw new ErrorWithStatus({
            status : HTTP_STATUS.UNAUTHORIZED,//401
            message : USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
        })
    }
    // nếu khớp mã, thì kiểm tra xem có trong database hay ko
    await usersServices.checkRefreshToken({
        user_id : user_id_rf,
        refresh_token
    })
    // nếu có thì mới logout(xóa refreshToken)
    await usersServices.logout(refresh_token)
    //
        res.status(HTTP_STATUS.OK).json({
            message : USERS_MESSAGES.LOGOUT_SUCCESS
        })
}
export const verifyEmailController = async(
    req : Request<ParamsDictionary,any,any,VerifyEmailReqQuery>,
    res : Response,
    next : NextFunction
) => {
    // vào tới controller thì nghĩa là email_verify_token đã đc xác thực
    const {email_verify_token} = req.query
    const {user_id} = req.decode_email_verify_token as TokenPayload
    // kiểm tra xem user_id và email_verify_token có tồn tại trong database hay không ?
    const user = await usersServices.checkEmailVerifyToken({user_id,email_verify_token})
    // kiểm tra xem người dùng có phải unverify không ? 
    if(user.verify == UserVerifyStatus.Verified){ //đang hỏi là trạng thái có phải là đang verify hay không ?
        res.status(HTTP_STATUS.OK).json({
            message : USERS_MESSAGES.EMAIL_HAS_BEEN_VERIFIED
        })
    }else if (user.verify == UserVerifyStatus.Banned){
        res.status(HTTP_STATUS.OK).json({
            message : USERS_MESSAGES.EMAIL_HAS_BEEN_BANNED
        })
    }else{
        // tiến hành verifyEmail
        const result = await usersServices.verifyEmail(user_id)
        res.status(HTTP_STATUS.OK).json({
            message : USERS_MESSAGES.VERIFY_EMAIL_SUCCESS,
            result
        })
    }
    

}
export const resendEmailVerifyController = async(
    req : Request<ParamsDictionary,any,any,VerifyEmailReqQuery>,
    res : Response,
    next : NextFunction
) => {
    // lấy user_id tìm xem user này còn tồn tại không 
    const {user_id} = req.decode_authorization as TokenPayload
    const user = await usersServices.findUserByID(user_id)
    // từ user đó xem thử nó bị verify , ban hay chưa verify 
    if(user.verify == UserVerifyStatus.Verified){ //đang hỏi là trạng thái có phải là đang verify hay không ?
        res.status(HTTP_STATUS.OK).json({
            message : USERS_MESSAGES.EMAIL_HAS_BEEN_VERIFIED
        })
    }else if (user.verify == UserVerifyStatus.Banned){
        res.status(HTTP_STATUS.OK).json({
            message : USERS_MESSAGES.EMAIL_HAS_BEEN_BANNED
        })
    }else{
        // tiến hành verifyEmail
        const result = await usersServices.resendEmailVerify(user_id)
        res.status(HTTP_STATUS.OK).json({
            message : USERS_MESSAGES.RESEND_EMAIL_VERIFY_TOKEN_SUCCESS,
            result
        })
    }
    // chưa verify thì mới resendEmailVerify cho m

}
export const forgotPasswordController = async(
    req : Request<ParamsDictionary,any,ForgetPasswordReqBody>,
    res : Response,
    next : NextFunction
) =>{
    // người dùng cung cấp email cho mình 
    const {email} = req.body
    // kiểm tra xem email có tồn tại trong database hay không
    const hasEmail = await usersServices.checkEmailExist(email)
    if(!hasEmail){
        throw new ErrorWithStatus({
            status : HTTP_STATUS.NOT_FOUND, //401
            message : USERS_MESSAGES.USER_NOT_FOUND
        })
    }else{
        // nếu có thì tạo token và mình gửi link
        await usersServices.forgotPassword(email)
        res.status(HTTP_STATUS.OK).json({
            message : USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
        })
    }
    
}
export const verifyForgotPasswordTokenController = async(
    req : Request<ParamsDictionary,any,VerifyForgotPasswordTokenReqBody>,
    res : Response,
    next : NextFunction
) => {
    // người dùng gửi lên forgot_password_token
    const {forgot_password_token} = req.body 
    // mình đã xác thực mã rồi
    // nhưng mà chỉ thực thi khi forgot_password_token còn hiệu lực với user
    // nên mình cần tìm user thông qua user_id
    const {user_id} = req.decode_forgot_password_token as TokenPayload
    // tìm user nào đang có 2thoonf tin trên , nếu ko tìm đc nghãi là forgot_password _Token
    // đã đc thay thế hoặc xóa đi
    await usersServices.checkForgotPassWordToken({user_id , forgot_password_token})
    res.status(HTTP_STATUS.OK).json({
        message : USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
    })
    
}
export const resetPasswordController = async(
    req : Request<ParamsDictionary,any,ResetPasswordReqBody>,
    res : Response,
    next : NextFunction
) =>{
 // người dùng gửi lên forgot_password_token
 const {forgot_password_token, password} = req.body 
 // mình đã xác thực mã rồi
 // nhưng mà chỉ thực thi khi forgot_password_token còn hiệu lực với user
 // nên mình cần tìm user thông qua user_id
 const {user_id} = req.decode_forgot_password_token as TokenPayload
 // tìm user nào đang có 2thoonf tin trên , nếu ko tìm đc nghãi là forgot_password _Token
 // đã đc thay thế hoặc xóa đi
 await usersServices.checkForgotPassWordToken({user_id , forgot_password_token})
//  nếu còn hiệu lực thì tiến hành cập nhật password
await usersServices.resetPassword({user_id,password})
 res.status(HTTP_STATUS.OK).json({
     message : USERS_MESSAGES.RESET_PASSWORD_SUCCESSS
 })
}
export const getMeController = async (
    req: Request<ParamsDictionary,any,any>,
    res: Response,
    next: NextFunction
  ) => {
    //middleware accessTokenValidator đã chạy rồi, nên ta có thể lấy đc user_id từ decoded_authorization
    const { user_id } = req.decode_authorization as TokenPayload;
    //tìm user thông qua user_id này và trả về user đó
    //truy cập vào database nên ta sẽ code ở user.services
    const userInfor = await usersServices.getMe(user_id); // hàm này ta chưa code, nhưng nó dùng user_id tìm user và trả ra user đó
    res.json({
      message: USERS_MESSAGES.GET_ME_SUCCESS,
      result: userInfor,
    });
}
export const updateMeController = async (
    req: Request<ParamsDictionary,any, UpdateMeReqBody>,
    res: Response,
    next : NextFunction
) =>{
    // người dùng truyền lên access_token ==> thu đc user_id
    const {user_id} = req.decode_authorization as TokenPayload
    // nội dung mà người dùng muốn cập nhật
    const payload = req.body
    // kiểm tra xem user này đã verify hay chưa
    const isVerified = await usersServices.checkEmailVerified(user_id)
    // đã verify rồi thì mình tiến hành cập nhật xong thì trả ra thông tin user sau cập nhật
    const userInfor = await usersServices.updateMe({user_id,payload})
    res.status(HTTP_STATUS.OK).json({
        message : USERS_MESSAGES.UPDATE_PROFILE_SUCCESS,
        userInfor
    })
}
export const changePasswordController = async (
    req : Request<ParamsDictionary,any,ChangePasswordReqBody>,
    res : Response,
    next: NextFunction
)=>{
    // muốn đổi mật khẩu thì họ phải đăng nhập
    // muốn biết thì phải thông qua access_token
    // từ đó lấy user_is
    const {user_id} = req.decode_authorization as TokenPayload
    // old password để biết họ có sở hữu account k
    const {password, old_password } = req.body
    await usersServices.changePassword({
        user_id,
        old_password,
        password
    })
    res.status(HTTP_STATUS.OK).json({
        message : USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    })
}
export const refreshTokenController = async(
    req : Request<ParamsDictionary,any,RefreshTokenReqBody>,
    res : Response,
    next : NextFunction
) => {
    // kiểm tra xem refresh_token có còn hiệu lực trong database hay không
    const{user_id} = req.decode_refresh_token as TokenPayload
    const{refresh_token} = req.body
    await usersServices.checkRefreshToken({user_id , refresh_token})
    // nếu mà kiểm tra không có gì xảy ra thì mình sẽ tiến hành refresh
    const result = await usersServices.refreshToken({user_id,refresh_token})
    // ta cần user_id để tìm và refresh_token để xóa mã cũ
    res.status(HTTP_STATUS.OK).json({
        message : USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
        result
    })
}