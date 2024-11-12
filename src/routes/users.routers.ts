import express, { Request, Response } from 'express'
import { changePasswordController, forgotPasswordController, getMeController, loginController, logoutController, refreshTokenController, registerController, resendEmailVerifyController, resetPasswordController, updateMeController, verifyEmailController, verifyForgotPasswordTokenController } from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middleware'
import { accessTokenValidator, changePasswordValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, updateMeValidator, verifyEmailTokenValidator, verifyForgotPasswordTokenValidator } from '~/middlewares/users.middlewares'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { UpdateMeReqBody } from '~/models/schemas/requests/users.requests'
import { wrapAsync } from '~/utils/handlers'
// dựng userRouter
const userRouter = express.Router()
// setup middlware (ở giữa):
// ở cuối gọi là controller
// tất cả đều gọi chung là handler (nhận res và req)
// những hàm có res req là handler 
// những hàm middlware có next
// còn những hàm ko có next là handler
// userRouter.use((req,res,next)=>{//ở đây có next vì nó ở giữa
//     // next ở đây đc dùng làm túi lọc
//     console.log('Time : ', Date.now());
//     return next()
//     //có next thì mới xuống đc , còn ko thì ko đc
//     // res.status(400).send('not allowed')
//     // console.log("Ahihih");
//     // luôn nhớ, trả về hay next thì hãy return để thôi code sẽ ko chạy xuống đc code dưới
    
    
// },
//     (req,res,next)=>{
//         console.log('Time2 : ', Date.now());
//         next()
//     })
// /users/login

// những hàm xử lý như này đc gọi là handler
// nhớ : trong 1 folder có nhiều handler :
userRouter.post('/login',loginValidator,loginController)
// chức năng đăng ký

/*
desc : Register a new user
Path : /register
method : POST
Body : {
    name : string,
    email : string,
    password : string,
    confirm_password : string,
    date_of_birth : string có dàng ISO8601 (vì người dùng ko có gửi đc date)
    
}
*/
userRouter.post('/register',registerValidator,wrapAsync(registerController))
/*
    desc : 
    path : users/login
    method : post 
    body :{
        email : string 
        password : string
    }
*/
userRouter.post('/login',loginValidator,wrapAsync(loginController))
// sài post bị lỗi vì đó là text , phải chuyển về json

/*desc: logout
path: users/logout
method: post
header: {
    Authorization: 'Bearer <access_token>'
}
    body: {
        refresh_token: string
    }
 */
userRouter.post('/logout',accessTokenValidator,refreshTokenValidator,wrapAsync(logoutController))

/*
desc : verify-email : khi người dùng vào email và bấm vào link để verify email
họ sẽ gửi verify_email_token lên cho mình
những cái gì mà điền điền + bấm thì post
còn nếu mỗi bấm đường link thì get
path: users/verify-email/?email_verify_token
method : get
*/
userRouter.get("/verify-email",verifyEmailTokenValidator,wrapAsync(verifyEmailController))

/*
    desc : Resend Email Verify
    Path : users/resend-email-verify
    chức năng này cần đăng nhấp để sử dụng ==> đưa ac để check xem có đang đăng nhập hay k
    headers:{
        Authorization : 'Bearer <access_token>'
    }
    method : post
*/
userRouter.post("/resend-email-verify",accessTokenValidator,wrapAsync(resendEmailVerifyController))
/*
    desc : forgot-password 
    khi mà ta bị quên mật khẩu hoặc bị hack, thì ta sẽ ko đăng nhập đc ,
    khi ko đăng nhấp đc ==> ko gửi ac 
    thứ duy nhất mà ta có thể cung cấp cho server là email
    path : users/forgot-password
    method : post
    body :{
        email : string
    }
*/
userRouter.post("/forgot-password",forgotPasswordValidator,wrapAsync(forgotPasswordController))
/*
des: Verify forgot password token
route kiểm tra forgot_password_token đúng và còn hiệu lực không
path: users/verify-forgot-password
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
body: {
forgot_password_token: string
}
*/
userRouter.post(
    "/verify-forgot-password",
    verifyForgotPasswordTokenValidator,// kiểm tra forgot_password_token 
    wrapAsync(verifyForgotPasswordTokenController) // xử lý logic
  );

  /*
    desc : reset-password
    path : users/reset-password
    method : post
    body :{
        password : string,
        confirm_password : string ,
        forgot_password_token : string
    }
  */
 userRouter.post("/reset-password",
    verifyForgotPasswordTokenValidator, //đầu tiên kiểm tra tk forgot_password_token trước rồi mới tới hàm dưới ==> tách thành 2 tầng
    resetPasswordValidator,//chứa các hàm để ktra password , confirm_password ,forgot_password_token
    wrapAsync(resetPasswordController) //tiến hành đổi mật khẩu
)
/*
des: get profile của user hay là get my profile
path: 'users/me'
method: post
Headers: {Authorization: Bearer <access_token>}
body: {}
*/
userRouter.post("/me", accessTokenValidator, wrapAsync(getMeController));

/*
des: update profile của user
path: '/me'
method: patch
Header: {Authorization: Bearer <access_token>}
body: {
  name?: string
  date_of_birth?: Date
  bio?: string // optional
  location?: string // optional
  website?: string // optional
  username?: string // optional
  avatar?: string // optional
  cover_photo?: string // optional}
*/
userRouter.patch(
    "/me",
    // cần 1 middlewware sàng lọc ra những gì cần lấy trong req.body 
    filterMiddleware<UpdateMeReqBody>([
        'name',
        'date_of_birth',
        'bio',
        'location',
        'website',
        'avatar',
        'username',
        'cover_photo'
    ]),
    accessTokenValidator,//
    updateMeValidator,
    wrapAsync(updateMeController)
  );

  /*
    desc : change-password
    chức năng đổi mật khâu
    path : users/change-password
    method : put
    header : {
        Authorization : 'Bearer <access_token>'
    }
    body:{
        old_password : string
        password : string
        confirm_password : string
    }
  */
 userRouter.put("/change-password",
                accessTokenValidator,
                changePasswordValidator,
                wrapAsync(changePasswordController))


/*
    desc : refresh_token
    path : users/refresh-token
    method : post 
    body : {
        refresh_token : string 
    }
*/
userRouter.post("/refresh-token",
    refreshTokenValidator,
    wrapAsync(refreshTokenController)
)
export default userRouter
// vào doc 12 để làm bài tập.   
// cần phải hiểu được hết các file trong đây ==> hiểu được tác dụng và cách để sử dụng
