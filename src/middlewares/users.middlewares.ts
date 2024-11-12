// import các interface của express để sử dụng cho việc
// định nghĩa
import { error } from "console"
import { verify } from "crypto"
import {Request , Response ,NextFunction, response } from "express"
import { check, checkSchema, ParamSchema } from "express-validator"
import { JsonWebTokenError, VerifyErrors } from "jsonwebtoken"
import HTTP_STATUS from "~/constants/httpStatus"
import { USERS_MESSAGES } from "~/constants/messages"
import { REGEX_USERNAME } from "~/constants/regex"
import { ErrorWithStatus } from "~/models/Errors"
import usersServices from "~/services/users.services"
import { verifyToken } from "~/utils/jwt"
import { validate } from "~/utils/validation"
// middleware là một handler có nhiệm vụ kiểm tra các giá
// trị mà người dùng gửi lên server
// nếu mà kiểm tra thành công thì mình next

// còn ko ok thì res cho người dùng (res.json)

// mô phỏng người dùng muốn login(đăng nhập)
// họ gửi req email và password lên server
// req này phải đi qua middleware này trước

// // ==> middlewares này sẽ chạy khi người dùng muốn login
// // và middlewares này sẽ kiểm tra email và password
// // tầng middleware chỉ đc kiểm tra 2 thứ : có hay ko ?
// //                                         đúng hay sai ?
// // không đc truy xuất database ==> chỉ đc kiểm tra

// export const loginValidator = (req:Request,res:Response,next:NextFunction) => {
//     // console.log(req.body)
//     const{ email , password } = req.body // lấy email và password trong req ra kt
//     // nếu 1 trong 2 k gửi lên đc
//     if(!email || !password){
//         res.status(400).json({
//             message : 'Missing email or Password'
//         })
//     }else{
//          // nếu không bị gì thì next
//         next()
//     }
   
// }
// nếu ko có validate : nó sẽ bắt đc lỗi nhưng ko báo lỗi , thay vào đó nó sẽ note lại thôi
// ==> nên cần phải làm một hàm , nhận vào checkSchema và trả ra checkSchema


//  PARAMSCHEMA : 
const passwordSchema : ParamSchema = {
        notEmpty :{
            errorMessage : USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString :{
            errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength :{
            options: {
                min : 8 ,
                max : 50
            },
            errorMessage : USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword :{
            options :{
                minLength : 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            // returnScore: true
            },
            errorMessage : USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
}
const confirmpasswordSchema : ParamSchema = {
    notEmpty :{
        errorMessage : USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED 
    },
    isString :{
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
    },
    isLength :{
        options: {
            min : 8 ,
            max : 50
        },
        errorMessage : USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
    },
    isStrongPassword :{
        options :{
            minLength : 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        // returnScore: true
        },
        errorMessage : USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
    },
    custom :{
        options: (value , {req}) => {
            // value chính là trường giá trị mà nó đang chứa
            // hay còn gọi value là conform_password
            if(value !== req.body.password){
                throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
            }else {
                return true
            }
        }
    }
}
const forgotPasswordTokenSchema : ParamSchema = {
    notEmpty:{
        errorMessage : USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED
    },
    trim: true,
    custom: {
      options : async (value : string , {req}) => {
        // value chính là forgot_password_token
        try {
            const decode_forgot_password_token = await verifyToken({
                token : value,
                privateKey : process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
            })
            ;(req as Request).decode_forgot_password_token = decode_forgot_password_token
        } catch (error) {
            throw new ErrorWithStatus({
                status : HTTP_STATUS.UNAUTHORIZED,
                message : (error as JsonWebTokenError).message
            })
        }
        //luôn luôn phải có return true , vì nếu ko có thì ko có kiểm tra
        return true
      }
    },
}
const nameSchema : ParamSchema = {
    notEmpty : {
        errorMessage : USERS_MESSAGES.PASSWORD_IS_REQUIRED
    },//ko để trống
    isString : {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
    } ,//phải là chuỗi
    trim : true , //không có dấu cách thừa
    isLength : {
        options:{
            min : 1,
            max : 100
        },
        errorMessage : USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
    }
}
const dateOfBirthSchema : ParamSchema = {
    isISO8601:{
        options:{
            strict :true,
            strictSeparator:true
        }
    }   
}
const emailSchema : ParamSchema = {
    notEmpty : {
        errorMessage : USERS_MESSAGES.EMAIL_IS_REQUIRED
    },
    isEmail : true ,
    trim : true 
}
export const registerValidator = validate(
    checkSchema({
    name : nameSchema,
    email : emailSchema,
    password : passwordSchema,
    confirm_password : confirmpasswordSchema,
    date_of_birth: dateOfBirthSchema
},
['body'])
)
export const loginValidator = validate(
    checkSchema({
        email : {
            notEmpty : {
                errorMessage : USERS_MESSAGES.EMAIL_IS_REQUIRED
            },
            isEmail : true ,
            trim : true 
        },
        password : passwordSchema
    },['body']/* sẽ nói cho schema biết là , nên check ở đâu thì sẽ oke hơn */)
)
const imageSchema: ParamSchema = {
    optional: true,
    isString: {
        errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING ////messages.ts thêm IMAGE_URL_MUST_BE_A_STRING: 'Image url must be a string'
    },
    trim: true,//nên đặt trim dưới này thay vì ở đầu
    isLength: {
        options: {
        min: 1,
        max: 400
        },
        errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH_MUST_BE_LESS_THAN_400 //messages.ts thêm IMAGE_URL_LENGTH_MUST_BE_LESS_THAN_400: 'Image url length must be less than 400'
    }
  }
export const refreshTokenValidator = validate(
    checkSchema({
        refresh_token :{
            notEmpty :{
                errorMessage : USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
            },
            custom :{
                options : async (value,{req}) => {
                    try {
                        const decode_refresh_token = await verifyToken({
                            token : value,
                            privateKey : process.env.JWT_SECRET_REFRESH_TOKEN as string,
                        })
                        // value là refresh_token , verify xong đc decode_refresh_token 
                        // là payload
                        // lưu vào req để xài ở tầng khác
                        ;(req as Request).decode_refresh_token = decode_refresh_token
                    } catch (error) {
                        throw new ErrorWithStatus({
                            status : HTTP_STATUS.UNAUTHORIZED, //401
                            message : (error as JsonWebTokenError).message
                        })
                    }
                    return true 
                }
            }
        }
    },['body'])
)
export const verifyEmailTokenValidator = validate(
    checkSchema({
        email_verify_token:{
            trim : true,
            notEmpty :{
                errorMessage : USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED
            },
            custom:{   
                    options: async (value : string ,{req})=>{
                        try{ 
                                // value chính là email_verify_token , mình cần verify nó là xong
                                const decode_email_verify_token = await verifyToken({
                                    token : value ,
                                    privateKey : process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
                                })
                                // lưu vào request để dùng ở controller
                                ;(req as Request).decode_email_verify_token = decode_email_verify_token
                        }catch(error){
                            throw new ErrorWithStatus({
                                status : HTTP_STATUS.UNAUTHORIZED,//401
                                message: (error as JsonWebTokenError).message
                            })
                        }
                    }
               
            }
        }
    },['query'])
)
export const forgotPasswordValidator = validate(
    checkSchema({
        email : emailSchema
    },['body'])
)
export const verifyForgotPasswordTokenValidator = validate(
    checkSchema(
    {
        forgot_password_token: forgotPasswordTokenSchema,
    },
    ['body'])
)
export const resetPasswordValidator = validate(
    checkSchema({  
        password : passwordSchema,
        confirm_password : confirmpasswordSchema,
    },
    ['body'])
)
export const accessTokenValidator = validate(
    checkSchema({
        Authorization : {
            notEmpty :{
                errorMessage : USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
            },
            custom:{
                options : async (value,{req}) =>{
                    // value có dạng 'Bearer <access_token>'
                    const access_token = value.split(' ')[1]
                    if(!access_token){
                        throw new ErrorWithStatus({
                            status :HTTP_STATUS.UNAUTHORIZED,//401
                            message : USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
                        })
                    }
                    // người dùng có gửi lên access_token
                    // verify accesss_token (so sánh chữ ký)
                    // nếu đúng chữ ký thì mình sẽ tin vào payload có trong token
                    // chờ tý code cái hàm r quay lại
                    try{
                    const decode_authorization = await verifyToken({
                        token : access_token,
                        privateKey : process.env.JWT_SECRET_ACCESS_TOKEN as string,
                    })
                    // decode_authorization là payload của access_ token
                    // decode_authorization có user_id và token_type
                    ;(req as Request).decode_authorization = decode_authorization
                    } catch(error){
                        throw new ErrorWithStatus({
                            status : HTTP_STATUS.UNAUTHORIZED, //401
                            message : (error as JsonWebTokenError).message
                        })
                    }
                    return true // hoàn thành các chướng ngại vật
                }
            }
        }   
    },
    ['headers']
    )
)
export const updateMeValidator = validate(
    checkSchema({
        name: {
            optional: true, //đc phép có hoặc k
            ...nameSchema, //phân rã nameSchema ra
            notEmpty: undefined //ghi đè lên notEmpty của nameSchema
        },
        date_of_birth: {
            optional: true, //đc phép có hoặc k
            ...dateOfBirthSchema, //phân rã nameSchema ra
            notEmpty: undefined //ghi đè lên notEmpty của nameSchema
        },
        bio: {
            optional: true,
            isString: {
            errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING ////messages.ts thêm BIO_MUST_BE_A_STRING: 'Bio must be a string'
            },
            trim: true, //trim phát đặt cuối, nếu k thì nó sẽ lỗi validatior
            isLength: {
            options: {
                min: 1,
                max: 200
            },
            errorMessage: USERS_MESSAGES.BIO_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm BIO_LENGTH_MUST_BE_LESS_THAN_200: 'Bio length must be less than 200'
            }
        },
        //giống bio
        location: {
            optional: true,
            isString: {
            errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING ////messages.ts thêm LOCATION_MUST_BE_A_STRING: 'Location must be a string'
            },
            trim: true,
            isLength: {
            options: {
                min: 1,
                max: 200
            },
            errorMessage: USERS_MESSAGES.LOCATION_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm LOCATION_LENGTH_MUST_BE_LESS_THAN_200: 'Location length must be less than 200'
            }
        },
        //giống location
        website: {
            optional: true,
            isString: {
            errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING ////messages.ts thêm WEBSITE_MUST_BE_A_STRING: 'Website must be a string'
            },
            trim: true,
            isLength: {
            options: {
                min: 1,
                max: 200
            },

            errorMessage: USERS_MESSAGES.WEBSITE_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm WEBSITE_LENGTH_MUST_BE_LESS_THAN_200: 'Website length must be less than 200'
            }
        },
        username: {
            optional: true,
            isString: {
            errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING ////messages.ts thêm USERNAME_MUST_BE_A_STRING: 'Username must be a string'
            },
            trim: true,
            isLength: {
            options: {
                min: 1,
                max: 50
            },
            errorMessage: USERS_MESSAGES.USERNAME_LENGTH_MUST_BE_LESS_THAN_50 //messages.ts thêm USERNAME_LENGTH_MUST_BE_LESS_THAN_50: 'Username length must be less than 50'
            },
            custom : {
                options :(value : string , {req}) =>{
                    // value chính lá username
                    if(!REGEX_USERNAME.test(value)){
                        throw new Error(USERS_MESSAGES.USERNAME_IS_VALID)
                    }
                    //nếu k bị gì thì kêt thúc
                    return true
                }
            }
        },
        avatar: imageSchema,
        cover_photo: imageSchema
    },['body'])
)
export const changePasswordValidator = validate(
    checkSchema({
        old_password : passwordSchema,
        password : passwordSchema,
        confirm_password : confirmpasswordSchema
    },['body'])
)