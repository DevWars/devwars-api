import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { getManager, getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import EmailVerification from '../../models/EmailVerification';
import User, { UserRole } from '../../models/User';
import PasswordReset from '../../models/PasswordReset';

import UserRepository from '../../repository/User.repository';
import PasswordResetRepository from '../../repository/PasswordReset.repository';

import ILoginRequest from '../../request/ILoginRequest';
import IRegistrationRequest from '../../request/RegistrationRequest';
import { AuthService } from '../../services/Auth.service';
import { VerificationService } from '../../services/Verification.service';
import { ResetService } from '../../services/Reset.service';
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
    public static async register(request: Request, response: Response) {
        let { username, email, password }: IRegistrationRequest = request.body;
        username = username.trim();
        email = email.trim();
        password = password.trim();

        if (!username || !email || !password) return response.sendStatus(400);

        const userRepository = await getCustomRepository(UserRepository);
        const existingUser = await userRepository.findOne({ where: [{ username }, { email }] });

        if (existingUser && existingUser.username === username) {
            return response.status(409).json({ message: 'Username is taken' });
        }

        if (existingUser && existingUser.email === email) {
            return response.status(409).json({ message: 'Email address is taken' });
        }

        const user = await AuthService.register({ username, email, password });

        response.cookie('token', await AuthService.newToken(user), { domain: process.env.COOKIE_DOMAIN });

        response.json(flattenUser(user));
    }

    public static async reVerify(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(request.cookies.token);

        await VerificationService.reset(user);

        response.json({
            message: 'Resent',
        });
    }

    public static async verify(request: Request, response: Response) {
        const { key } = request.query;

        const foundToken = await EmailVerification.findOne({
            where: { token: key },
            relations: ['user'],
        });

        if (foundToken) {
            const { user } = foundToken;

            user.role = UserRole.USER;

            await getManager().transaction(async (transaction) => {
                await transaction.remove(foundToken);
                await transaction.save(user);
            });
        }

        const redirectUrl = `${process.env.FRONT_URL}`;
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
            response.cookie('token', token, { domain: process.env.COOKIE_DOMAIN });

            user.lastSignIn = new Date();
            await user.save();

            response.json(flattenUser(user));
        }
    }

    public static async logout(request: Request, response: Response) {
        const { token } = request.cookies;

        if (!token) throw new Error('logout failed');

        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(token);

        if (!user) throw new Error('logout failed');

        user.token = null;

        await User.save(user);

        response.cookie('token', null, { domain: process.env.COOKIE_DOMAIN });
        response.json({
            message: 'Success',
        });
    }

    public static async currentUser(request: Request, response: Response) {
        let { token } = request.cookies;

        if (token) token = token;
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(token);

        if (!user) response.status(404).send('You are not logged in');

        response.json(user);
    }

    public static async initiateEmailReset(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findOne(request.params.user.id);
        const { password, email } = request.body;

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

    public static async initiatePasswordReset(request: Request, response: Response) {
        const { username_or_email } = request.body;

        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByCredentials({ identifier: username_or_email });

        if (!user) {
            return response.status(404).json({ message: 'User not found' });
        }

        const passwordResetRepository = await getCustomRepository(PasswordResetRepository);
        await passwordResetRepository.delete({ user });

        await AuthService.resetPassword(user);

        response.json({
            message: 'Reset password, check your email',
        });
    }

    public static async resetPassword(request: Request, response: Response) {
        const { key, password } = request.query;

        const passwordResetRepository = await getCustomRepository(PasswordResetRepository);
        const passwordReset = await passwordResetRepository.findByToken(key);

        if (!passwordReset) {
            return response.status(400).json({ message: 'Could not reset password' });
        }

        if (Date.now() > passwordReset.expiresAt.getTime()) {
            return response.status(401).json({ message: 'Expired password reset token' });
        }

        const user = passwordReset.user;
        user.password = await hash(password);

        await getManager().transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.delete(PasswordReset, passwordReset.id);
            await transactionalEntityManager.save(user);
        });

        return response.json({
            message: 'Password reset!',
        });
    }
}
