import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { UserRepository } from '../../repository';
import { AvatarService } from '../../services/Avatar.service';

export class AvatarController {
    /**
     * @api {post} /user/:user/avatar Update a user's avatar
     * @apiVersion 1.0.0
     * @apiName all
     * @apiGroup User
     *
     * @apiParam {Number} User ID
     *
     * @apiSuccess {String} message       Success message
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         message: "Success"
     *     }
     */

    public static async store(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(request.cookies.auth);

        try {
            await AvatarService.updateAvatarForUser(user, request.file.path);
        } catch (e) {
            response.json({
                error: "We couldn't upload your avatar",
            });
        }

        response.json({
            message: 'Okay',
        });
    }
}
