import * as express from 'express';
import * as multer from 'multer';

import {AvatarController} from '../controllers/user/Avatar.controller';

const upload = multer({dest: 'uploads/'});

export const AvatarRoute: express.Router = express.Router()
    .post('/:user/avatar', upload.single('avatar'), AvatarController.store);
