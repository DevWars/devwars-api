import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';

import EmailVerification from '../../models/EmailVerification';
import PasswordReset from '../../models/PasswordReset';
import User, { UserRole } from '../../models/User';

import UserRepository from '../../repository/User.repository';

import ILoginRequest from '../../request/ILoginRequest';
import IRegistrationRequest from '../../request/RegistrationRequest';
import { AuthService } from '../../services/Auth.service';
import { VerificationService } from '../../services/Verification.service';
import { hash } from '../../utils/hash';

function flattenUser(user: User) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl,
    };
}
export class AuthController {
    /**
     * @api {post} /auth/register Registers user
     * @apiVersion 1.0.0
     * @apiName register
     * @apiGroup Auth
     *
     * @apiSuccess {Date} auth.createdAt       Time created
     * @apiSuccess {Date} auth.updatedAt       Time updated
     * @apiSuccess {String} auth.email         Email address
     * @apiSuccess {String} auth.username      Username
     * @apiSuccess {String} auth.password      Hashed Password
     * @apiSuccess {String} auth.role          Current role of user
     * @apiSuccess {String} auth.token         Generated user token
     * @apiSuccess {String} auth.avatarUrl     URL for avatar image
     * @apiSuccess {Object} auth.analytics     User analytics
     * @apiSuccess {Object} auth.profile       User profile information
     * @apiSuccess {Object} auth.statistics    User Coins and XP
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "id": 1,
     *       "createdAt": "2018-10-21T21:45:45.000Z",
     *       "updatedAt": "2018-10-21T21:45:45.000Z",
     *       "email": "test@test.com"
     *       "username": "testuser",
     *       "password": "$2b$04$4OyBt68kkT5FyN/AFhye0OSH/fgR5MG8QlcJvT.4iSHCbsiVigXO.",
     *       "role": "PENDING",
     *       "token": "wmzqzhz8zzhrngipmmqqbb0229m9egiz",
     *       "avatarUrl": null,
     *       "analytics": null,
     *       "profile": { about: null, forHire: null, location: null, websiteUrl: null },
     *       "statistics": { coins: 0, xp: 0 }
     *     }
     */

    public static async register(request: Request, response: Response) {
        const { username, email, password }: IRegistrationRequest = request.body;

        // TODO: IMPORTANT add checks for them. Huge security risk. We can user validator or inside models
        // and after should add test too
        if (!username || !email || !password) throw new Error('params missing');

        const user = await AuthService.register({ username, email, password });

        response.cookie('auth', await AuthService.newToken(user), { domain: process.env.COOKIE_DOMAIN });

        response.json(flattenUser(user));
    }

    public static async reVerify(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(request.cookies.auth);

        await VerificationService.reset(user);

        response.json({
            message: 'Resent',
        });
    }

    public static async verify(request: Request, response: Response) {
        const { key } = request.query;
        const redirectUrl = `${process.env.FRONT_URL}`;

        const foundToken = await EmailVerification.findOne({ where: { token: key } });

        if (foundToken) {
            const { user } = foundToken;

            user.role = UserRole.USER;

            await user.save();
            await foundToken.remove();
        }

        response.redirect(redirectUrl);
    }

    public static async login(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const { identifier, password } = { ...(request.body as ILoginRequest) };
        const user = await userRepository.findByCredentials({ identifier });

        if (!user) {
            return response.status(400).send('Invalid Credentials');
        }

        const passwordsMatch: boolean = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
            return response.status(400).send('Invalid Credentials');
        } else {
            const token = await AuthService.newToken(user);

            response.cookie('auth', token, { domain: process.env.COOKIE_DOMAIN });

            response.json(flattenUser(user));
        }
    }

    public static async logout(request: Request, response: Response) {
        const { auth } = request.cookies;

        if (!auth) throw new Error('logout failed');

        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(auth);

        if (!user) throw new Error('logout failed');

        user.token = null;

        await User.save(user);

        response.cookie('auth', null, { domain: process.env.COOKIE_DOMAIN });
        response.json({
            message: 'Success',
        });
    }

    public static async currentUser(request: Request, response: Response) {
        const { auth } = request.cookies;
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(auth);

        if (!user) {
            response.status(404).send('You are not logged in');
        }

        response.json(user);
    }

    public static async initiatePasswordReset(request: Request, response: Response) {
        const { username_or_email } = request.body;

        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByCredentials({ identifier: username_or_email });

        if (user) {
            await AuthService.resetPassword();
        }

        response.json({
            message: 'Reset password, check your email',
        });
    }

    public static async resetPassword(request: Request, response: Response) {
        const { key, password } = request.query;

        const reset = await PasswordReset.findOne({ where: { token: key }, relations: ['user'] });

        if (!reset) {
            return response.status(400).json({
                message: 'Could not reset password',
            });
        }

        const { user } = reset;

        user.password = await hash(password);

        await user.save();

        return response.json({
            message: 'Password reset',
        });
    }
}
