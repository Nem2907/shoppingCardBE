import User from "~/models/schemas/User.schema";
import databaseServices from "./database.services";
import { LoginReqBody, RegisterReqBody, TokenPayload, UpdateMeReqBody } from "~/models/schemas/requests/users.requests";
import { hashPassword } from "~/utils/crypto";
import { signToken } from "~/utils/jwt";
import { TokenType, UserVerifyStatus } from "~/constants/enums";
import { ErrorWithStatus } from "~/models/Errors";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/messages";
import RefreshToken from "~/models/schemas/RefreshToken.schema";
import { ObjectId } from "mongodb";
import { verify } from "crypto";
import { update } from "lodash";

class UsersServices{
    private signAccessToken(user_id:string){
        return signToken({
            payload : {user_id, token_type: TokenType.AccessToken},
            privateKey : process.env.JWT_SECRET_ACCESS_TOKEN as string,
            options : {expiresIn : process.env.ACCESS_TOKEN_EXPIRE_IN}
        })
    }
    private signEmailVerifyAccessToken(user_id:string){
        return signToken({
            payload : {user_id, token_type: TokenType.EmailVerificationToken},
            privateKey : process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN  as string,
            options : {expiresIn : process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN}
        })
    }
    private signforgotPasswordToken(user_id:string){
        return signToken({
            payload : {user_id, token_type: TokenType.ForgetPasswordToken},
            privateKey : process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
            options : {expiresIn : process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN}
        })
    }

    private signRefressToken(user_id:string){
        return signToken({
            payload : {user_id, token_type: TokenType.AccessToken},
            privateKey : process.env.JWT_SECRET_REFRESH_TOKEN as string,
            options : {expiresIn : process.env.REFRESH_TOKEN_EXPIRE_IN}
        })
    }

    async checkEmailExist(email:string){
        //lên database tìm user đang sở hữu email này
        const user = await databaseServices.users.findOne({email})
        return Boolean(user)
        /*
            thay vì 
            return user : "" ? false : true
            hoặc if
            thì ta dùng cách trên oke hơn
        */
    }

    async checkRefreshToken({user_id, refresh_token}:{user_id : string , refresh_token : string}){
        const refreshtoken = await databaseServices.refresh_tokens.findOne({
            user_id : new ObjectId(user_id),
            token : refresh_token
        })  
        if(!refreshtoken){
            throw new ErrorWithStatus({
                status : HTTP_STATUS.UNAUTHORIZED, //401
                message : USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
            })
        }
        return refreshtoken
    }
    async checkEmailVerifyToken({
        user_id,
        email_verify_token} 
        :{
        user_id : string , 
        email_verify_token : string //
    }) {
        // tìm user bằng user_id và email_verify_token
        const user = await databaseServices.users.findOne({
            _id : new ObjectId(user_id),
            email_verify_token
        })
        if(!user){
            throw new ErrorWithStatus({
                status : HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
                message : USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID
            })
        }
        return user 
        //return ra ngoài để kiểm tra xem có verify hay gì không?
    }
    async register(payload:RegisterReqBody){
        // gọi server và lưu vào
        const user_id = new ObjectId()
        const email_verify_token = await this.signEmailVerifyAccessToken(user_id.toString())
        const result = await databaseServices.users.insertOne(
            new User({
                _id:user_id,
                email_verify_token,
                username :`uses${user_id.toString()}`,
                ...payload,
                password : hashPassword(payload.password),
                date_of_birth : new Date(payload.date_of_birth)//overwrite : ghi đè
            })
        )
        // dùng user_id ký 2 mã ac và rf
        // const access_token = await this.signAccessToken(user_id)
        // const refresh_token = await this.signRefressToken(user_id)
        // return{
        //     access_token,
        //     refresh_token
        // }
        // thay vì dùng ở trên là từng cái chạy
        // thì ta có thể dùng cái dưới , nó sẽ cùng chạy
        const [access_token,refresh_token] = await Promise.all([
            this.signAccessToken(user_id.toString()),
            this.signRefressToken(user_id.toString())
        ])
         // ném ra object có 2 token
        //  gửi link có email_verify_token qua email
        console.log(`mô phỏng gửi link qua mail xác thực đăng ký :
            http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}
            `)
        
        // lưu rf
        await databaseServices.refresh_tokens.insertOne(
            new RefreshToken({
                token: refresh_token,
                user_id : new ObjectId(user_id)
            })
        )
        return {
            access_token,
            refresh_token
        }
    }
    async login({email,password}:LoginReqBody){
        const user = await databaseServices.users.findOne({
            email,
            password : hashPassword(password)
        })
        // sẽ có 2 trường hợp
        // email và password không tìm đucợ user ==> email và password
        if(!user){
            throw new ErrorWithStatus({
                status : HTTP_STATUS.UNPROCESSABLE_ENTITY , //422 
                message : USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT
            })
        }
        // nếu qua if ==> thì có nghĩa là có user ==> đúng
        // tạo ac và rf
        const user_id = user._id.toString()
        const [access_token, refresh_token] = await Promise.all([
            this.signAccessToken(user_id),
            this.signRefressToken(user_id)
        ])
        await databaseServices.refresh_tokens.insertOne(
            new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
          )
        return{
            access_token,
            refresh_token
        }
    }
    async logout(refresh_token:string){
        await databaseServices.refresh_tokens.deleteOne({
            token : refresh_token
        })
    }
    async verifyEmail(user_id :string){
        await databaseServices.users.updateOne({
            _id : new ObjectId(user_id)
        },[
        {
            $set:{
                verify : UserVerifyStatus.Verified,
                email_verify_token : "",
                updated_at : '$$NOW'
            }
        }
        ])
        //tạo ac và rf để người dùng đăng nhập luôn
        const [access_token, refresh_token] = await Promise.all([
            this.signAccessToken(user_id),
            this.signRefressToken(user_id)
        ])
        await databaseServices.refresh_tokens.insertOne(
            new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
          )
        return{
            access_token,
            refresh_token
        }
    }
    async findUserByID(user_id:string){
        const user = await databaseServices.users.findOne({_id :new ObjectId(user_id)})
        if(!user){
            throw new ErrorWithStatus({
                status : HTTP_STATUS.NOT_FOUND, //404
                message : USERS_MESSAGES.USER_NOT_FOUND
            })
        }else{
            return user //thay cho true
        }
    }
    async resendEmailVerify(user_id : string){
        //tạo lại mã evt
        const email_verify_token = await this.signEmailVerifyAccessToken(user_id)
        // tìm user bằng user_id để cập nhật lại mã
        await databaseServices.users.updateOne({
            _id: new ObjectId(user_id)
        },[
            {
                $set:{
                    email_verify_token,
                    update_at:'$$NOW'
                }
            }
        ])
        // gửi lại
        console.log(`mô phỏng gửi link qua mail xác thực đăng ký :
            http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}
            `)
    }
    async checkForgotPassWordToken({
        user_id,
        forgot_password_token
    } : {
        user_id : string , //
        forgot_password_token : string 
    }){
        // tìm 2 user với 2 thông tin trên , không có thì chửi , còn có thì return
        const user = await databaseServices.users.findOne({
            _id : new ObjectId(user_id),
            forgot_password_token
        })
        if(!user){
            throw new ErrorWithStatus({
                status : HTTP_STATUS.UNAUTHORIZED,
                message : USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID
            })
        }
        // nếu có user
        return user
    }
    async forgotPassword(email:string){
        const user = (await databaseServices.users.findOne({
            email
        }))as User
        // lấy user_id tạo mã forrgor_password_token
        const user_id = user._id as ObjectId
        const forgot_password_token = await this.signforgotPasswordToken(user_id.toString())
        // lưu vào database
        await databaseServices.users.updateOne({
            _id : user_id
        },[
            {
                $set:{
                    forgot_password_token,
                    update_at : '$$NOW'
                }
            }
        ]) 
        // gửi mail
        console.log(`mô phỏng gửi link qua mail để đổi mật khẩu :
            http://localhost:8000/reset-password/?forgot_password_token=${forgot_password_token}
            `)
    }
    //trong dó projection(phép chiếu pi) giúp ta loại bỏ lấy về các thuộc tính như password, email_verify_token, forgot_password_token
    async resetPassword({user_id,password} : {
            user_id : string,
            password : string
        }){
            await databaseServices.users.updateOne(
            {_id : new ObjectId(user_id)},
            [
                {
                    $set:{
                        password : hashPassword(password),
                        forgot_password_token : '',
                        update_at : `$$NOW`
                    }
                }
            ]
        )
    }
    async getMe(user_id: string) {
        const userInfor = await databaseServices.users.findOne(
          { _id: new ObjectId(user_id) },
          {
            projection: {
              password: 0,
              email_verify_token: 0,
              forgot_password_token: 0
            }
          }
        )
        return userInfor // sẽ k có những thuộc tính nêu trên, tránh bị lộ thông tin
    }
    async checkEmailVerified(user_id:string){
        const user = databaseServices.users.findOne({
            _id: new ObjectId(user_id),
            verify: UserVerifyStatus.Verified
            //vào trong đay , tìm thằng user mà có _id và đã verify
        })
        if(!user){
            throw new ErrorWithStatus({
                status : HTTP_STATUS.UNFOBBIDEN,//403 
                message : USERS_MESSAGES.USER_NOT_FOUND
            })
        }
        //nếu có chắc user
        return user
    }
    async updateMe({user_id,payload} :{
        user_id : string,
        payload : UpdateMeReqBody
    }){
        // user_id giúp mình tìm đc user cần cập nhật
        // payload là những gì người dùng muốn cập nhật, mình không biết họ đã gửi lên những gì
        // nếu date_of_birth thì nó cần chuyển về Date
        const _payload = payload.date_of_birth
        ? {...payload, date_of_birth : new Date(payload.date_of_birth)}
        :payload 
        //nếu username đc gửi lên thì phải unique
        if(_payload.username){
            const isDup = await databaseServices.users.findOne({
                username : _payload.username
            })
            if(isDup){
                throw new ErrorWithStatus({
                    status : HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    message: USERS_MESSAGES.USERNAME_ALREADY_EXISTS
                })
            }
        }
        //nếu qua hết thì cập nhật
        const userInfo = await databaseServices.users.findOneAndUpdate(
            {_id : new ObjectId(user_id)},
            [
                {
                    $set:{
                        ..._payload,
                        updated_at: '$$NOW'
                    }
                }
            ],{
                returnDocument : 'after',
                projection:{
                    password : 0 ,
                    email_verify_token : 0,
                    forgot_password_token: 0
                }
            }
        )
        return userInfo
    }
    async changePassword({
        user_id,
        old_password,
        password
    }:{
        user_id : string ,
        old_password : string,
        password : string
    }){
        // tìm user với user_id và old_password có tìm đc user không ?
        const user = await databaseServices.users.findOne({
            _id : new ObjectId(user_id),
            password : hashPassword(old_password)
        })
        // 
        if(!user){
            throw new ErrorWithStatus({
                status : HTTP_STATUS.UNAUTHORIZED,
                message : USERS_MESSAGES.USER_NOT_FOUND
            })
        }
        await databaseServices.users.updateOne({
            _id : new ObjectId(user_id)
        },[
            {
                $set:{
                    password : hashPassword(password),
                    forgot_password_token :'',
                    update_at : '$$NOW'
                }
            }
        ])
    }
    async refreshToken({
        user_id ,
        refresh_token
    }:{
        user_id : string ,
        refresh_token : string
    }){
        // tạo ac và rf
        const[access_token,new_refresh_token] = await Promise.all([
            this.signAccessToken(user_id),
            this.signRefressToken(user_id)
        ])
        // lưu rf mới
        await databaseServices.refresh_tokens.insertOne(
            new RefreshToken({
                token : new_refresh_token,
                user_id : new ObjectId(user_id)
            })
        )
        // xóa rf cũ
        await databaseServices.refresh_tokens.deleteOne({token:refresh_token})
        return {
            access_token,
            refresh_token:new_refresh_token
        }
    }
}


// tạo instance trước
const usersServices = new UsersServices()

export default usersServices