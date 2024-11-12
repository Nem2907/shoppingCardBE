import {Request, Response, NextFunction } from "express";
import formidable from "formidable";
import path from 'path'
export const updateSingleImageController = async(
    req : Request,
    res : Response,
    next : NextFunction
)=>{
    //test
    // __dirname : đường dẫn đến folder đang chạy file này
    // hãy nhớ
    // console.log(__dirname); // ==> D:\ExtraClass\PIEDTEAM_CODE_MERN\CH05-nodejs\ch04-shoppingCardProject\shoppingCardBE\src\controllers
    console.log(path.resolve('upload'));// D:\ExtraClass\PIEDTEAM_CODE_MERN\CH05-nodejs\ch04-shoppingCardProject\shoppingCardBE\upload
    // resolve : đang thăm dò xem có thư mục tên là upload không ?
    // path.resolve : đường dẫn đến thư mục mà chúng ta muốn
    // tạo một cái khung để khi người dùng gửi file lên sẽ bị mình dùng khung đó
    // để kiểm tra (ép kiểu)
    // nếu đẹp thì oke
    // còn vỡ thì ko chó
    const form = formidable({ // formidable như middleware, có chức năng chặn các bức hình
        maxFiles : 1 ,//tối đa 1 file để tránh video
        maxFileSize : 1024 * 300, // 1 hình thì tối đa 300kb mà thôi
        keepExtensions : true,//giữ lại đuôi file để kiểm tra
        // để biết người dùng nó có gửi sai file hay không
        uploadDir : path.resolve('uploads')
    })
    //đã chuẩn bị xong form để kiểm tra các file rồi
    // giờ chúng ta sẽ form để kiểm tra request mà người dùng gửi lên
    form.parse(req,(err,fields,files)=>{
        //files là object chứa các file do người dùng gửi lên
        // fields là
        if(err){
            throw err
        }else{
            res.json({
                message : "Upload image successFully"
            })//và nội dung sẽ đc lưu vào /image
        }
    })// ở đây nó sẽ nhận một callbackfn để xử lý việc
    // bị lỗi khi gửi lên server
    //khi người dùng gửi lên , nó sẽ đi qua file này , file này như một cái lưới
    // res.json({
    //     message : "Hello"
    // })
}