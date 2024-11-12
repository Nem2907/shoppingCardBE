import {Router} from 'express'
import { updateSingleImageController } from '~/controllers/media.controller.'
import { wrapAsync } from '~/utils/handlers'

const mediaRouter = Router()
// làm một route cho người dùng upload file lên
mediaRouter.post("/upload-image",wrapAsync(updateSingleImageController))

export default mediaRouter