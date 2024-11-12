import express from 'express'
import userRouter from './routes/users.routers'
import databaseServices from './services/database.services'
import { defaultErrorHandle } from './middlewares/errors.middlewares';
import mediaRouter from './routes/media.router';
import { initFolder } from './utils/file';
console.log(new Date(2005,7,29).toISOString());

// dùng express tạo server(app)
const app = express()
const PORT = 3000
databaseServices.connet() // kết nối database
// c    ho server chay middleware chuyển json
app.use(express.json())//server ơi , có ai mà chuyển dữ liệu lên thì đổi json dùm nha
initFolder()
// server dùng userRouter
app.use('/users',userRouter)
app.use('/medias',mediaRouter)


// xử lý lỗi tổng
// tất cả lỗi của toàn bộ hệ thống đều dồn về cuối cùng này
app.use(defaultErrorHandle)
// app mở ở PORT 3000
// localhost : 3000
app.listen(PORT,() =>{
    console.log("Server BE đang chạy ở Port :" +PORT);
})
// flow code
/*
khi mà local host chạy thì nó mới tới app mà thôi , sau đó /users sẽ đến đc userRouter
mà trong userRouter có /get-me ==> bấm /get-me sẽ đc dữ liệu


local/host:3000/users/login : req.body
*/ 
