import fs from 'fs' //fs là một thư viên giúp thao tác với file trong máy tính
import path from 'path'
// hàm này kiểm tra thư mục lưu ảnh có chưa 
// nếu chưa có thì tự tạo
// còn có rồi thì thôi khỏi tạo
export const initFolder = () =>{ 
    const uploadFolderPath = path.resolve('uploads')
    // kiểm tra xem đường dẫn này có dẫn đến đâu không
    if(!fs.existsSync(uploadFolderPath)){
        fs.mkdirSync(uploadFolderPath,{
            recursive : true//đệ quy ==> lọc
        })
    }
    // nếu không có nghĩa là chưa có thư mục ==> tạo
}