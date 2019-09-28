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
    /**
     * Attempts to register a new user with the service, enforcing validation checks on the
     * username, password and email provided. If all process checks complete and are valid,
     * new/unique, then a welcome email will be sent out to introduce the new user.
     *
     * @api {post} /register Attempts to createa a new user with the service.
     * @apiVersion 1.0.0
     * @apiName Register
     * @apiGroup Authentication
     *
     * @apiSuccess {User} user The user of the newly created account.
     */
    public static async register(request: Request, response: Response) {
        let { username, email, password }: IRegistrationRequest = request.body;

        // if any of the provided username, email or password are empty, then return a 400 since all
        // processes are required to ensure a correct registering process. This validation will
        // occur before increased validation on the quality of email, username and password.
        if (_.isNil(username) || _.isNil(email) || _.isNil(password)) return response.sendStatus(400);

        // trim out any remaining spaces on either end of the username, password or email before joi
        // validation. Since we don't want the chance of spaces ruining the sign in process or
        // emailing process for the authenticating user.
        username = username.trim();
        password = password.trim();
        email = email.trim();

        const userRepository = getCustomRepository(UserRepository);
        const existingUser = await userRepository.findOne({ where: [{ username }, { email }] });

        if (existingUser && existingUser.username === username) {
            return response.status(409).json({ message: 'Username is taken' });
        }

        if (existingUser && existingUser.email === email) {
            return response.status(409).json({ message: 'Email address is taken' });
        }

        // Register the user in the database, generating a new user with the default and minimal
        // stats / settings for usage.
        const user = await AuthService.register({ username, email, password });

        // Gather and bind the new token for the newly registered user, removing the need for the
        // user to again login since they have "already" authenticated with the service with the
        // registering process.
        response.cookie('token', await AuthService.newToken(user), { domain: process.env.COOKIE_DOMAIN });
        response.json(flattenUser(user));
    }

    public static async reVerify(request: Request, response: Response) {
        const userRepository = getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(request.cookies.token);

        await VerificationService.reset(user);

        response.json({
            message: 'Resent',
        });
    }

    public static async verify(request: Request, response: Response) {
        const { token } = request.query;

        // gather the verification / user link based on the provided token in the query. ensuring to
        // keep the relation set otherwise no user will be on the return object.
        const verificationToken = await EmailVerification.findOne({
            relations: ['user'],
            where: { token },
        });

        // if no verification object could be found, then redirect the user back to the home page.
        // this will happen regardless but clearly defined redirect based on failed validation check
        // will ensure future understanding.
        if (_.isNil(verificationToken)) return response.redirect(process.env.FRONT_URL);

        // update the user role, ensuring that they are now removed from the pending state and
        // returned or setup as a standard user, then updating the database with this change.
        const { user } = verificationToken;
        user.role = UserRole.USER;

        await getManager().transaction(async (transaction) => {
            await transaction.remove(verificationToken);
            await transaction.save(user);
        });

        response.redirect(process.env.FRONT_URL);
    }

    /**
     *
     * @api {post} /login Attempts to authenticate the provided user into the system.
     * @apiVersion 1.0.0
     * @apiName Login
     * @apiGroup Authentication
     *
     * @apiSuccess {User} user The user of the newly created account.
     */
    public static async login(request: Request, response: Response) {
        const { identifier, password } = { ...(request.body as ILoginRequest) };

        const userRepository = getCustomRepository(UserRepository);
        const user = await userRepository.findByCredentials({ identifier });

        // if the user does not exist by the provided credentails, then exist before continuing.
        // Ensuring that the user is aware that they are invalid and not able to login due to that
        // reason.
        if (_.isNil(user)) return response.status(400).send('the provided username or password is not correct.');

        // Ensure that the password provided matches the encrypted password stored in the database, this will be using
        // the salt and hash with the secret in bcrypt.
        const passwordsMatch: boolean = await bcrypt.compare(password, user.password);

        // if the password does not match, ensure the user is told about the authentication failing.
        if (!passwordsMatch) return response.status(400).send('the provided username or password is not correct.');

        const token = await AuthService.newToken(user);
        response.cookie('token', token, { domain: process.env.COOKIE_DOMAIN });

        user.lastSignIn = new Date();
        await user.save();

        response.json(flattenUser(user));
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
        const { token } = request.cookies;

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
        const { token, password } = request.query;

        const passwordResetRepository = await getCustomRepository(PasswordResetRepository);
        const passwordReset = await passwordResetRepository.findByToken(token);

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
