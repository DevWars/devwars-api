import {Request, Response} from 'express';
import {UserRepository} from '../../repository';

import * as bcrypt from 'bcrypt';
import {ResetService} from '../../services/Reset.service';
import {hash} from '../../utils/hash';

export class ResetController {
    public static async email(request: Request, response: Response) {
        const user = await UserRepository.byId(request.params.user);
        const {password, email} = request.body;

        const passwordsMatch: boolean = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
            return response.status(400).json({
                message: 'Password did not match',
            });
        }

        await ResetService.resetEmail(user, email);

        response.json({
            message: 'Email reset',
        });
    }

    public static async password(request: Request, response: Response) {
        const user = await UserRepository.byId(request.params.user);
        const {newPassword} = request.body;

        user.password = await hash(newPassword);

        await user.save();

        response.json({
            message: 'Password reset',
        });
    }
}
