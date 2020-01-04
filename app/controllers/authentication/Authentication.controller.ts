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

import { IRequest } from '../../request/IRequest';
import ApiError from '../../utils/apiError';

function flattenUser(user: User) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl,
    };
}
/**
 * Attempts to register a new user with the service, enforcing validation checks on the
 * username, password and email provided. If all process checks complete and are valid,
 * new/unique, then a welcome email will be sent out to introduce the new user.
 *
 * @api {post} /register Attempts to creates a new user with the service.
 * @apiVersion 1.0.0
 * @apiName Register
 * @apiGroup Authentication
 *
 * @apiSuccess {User} user The user of the newly created account.
 */
export async function register(request: Request, response: Response) {
    let { username, email, password }: IRegistrationRequest = request.body;
    username = username.trim();
    password = password.trim();
    email = email.trim();

    const userRepository = getCustomRepository(UserRepository);
    const existingUser = await userRepository.findByUsernameOrEmail(username, email);

    if (existingUser && existingUser.username.toLowerCase() === username.toLowerCase()) {
        throw new ApiError({ error: 'A user already exists with the provided username.', code: 409 });
    }

    if (existingUser && existingUser.email.toLowerCase() === email.toLowerCase()) {
        throw new ApiError({ error: 'A user already exists with the provided email.', code: 409 });
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

/**
 * @api {post} /auth/reverify Sends out a users verification email.
 * @apiDescription Goes through the verification process once again with the authenticated user
 * with the system. Only if the user is not already verified.
 * @apiVersion 1.0.0
 * @apiName Reverify
 * @apiGroup Authentication
 *
 * @apiSuccess {User} user The user of the newly created account.
 */
export async function reverify(request: IRequest, response: Response) {
    // If the user is not in the pending state, return out early stating that its complete with
    // the status of already being verified. This is a edge case which is unlikely to be done
    // through standard user interaction.
    if (request.user.role !== UserRole.PENDING) {
        return response.json({ message: `${request.user.username} is already verified` });
    }

    await VerificationService.reset(request.user);
    return response.json({ message: 'Resent verification email.' });
}

export async function verify(request: Request, response: Response) {
    const { token } = request.query;

    // Gather the verification / user link based on the provided token in the query. ensuring to
    // keep the relation set otherwise no user will be on the return object.
    const verificationToken = await EmailVerification.findOne({
        relations: ['user'],
        where: { token },
    });

    // If no verification object could be found, then redirect the user back to the home page.
    // this will happen regardless but clearly defined redirect based on failed validation check
    // will ensure future understanding.
    if (_.isNil(verificationToken)) return response.redirect(process.env.FRONT_URL);

    // Update the user role, ensuring that they are now removed from the pending state and
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
export async function login(request: Request, response: Response) {
    const { identifier, password } = { ...(request.body as ILoginRequest) };

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findByCredentials({ identifier });

    // If the user does not exist by the provided credentials, then exist before continuing.
    // Ensuring that the user is aware that they are invalid and not able to login due to that
    // reason.
    if (_.isNil(user)) {
        throw new ApiError({
            error: 'The provided username or password is not correct.',
            code: 400,
        });
    }
    // Ensure that the password provided matches the encrypted password stored in the database, this will be using
    // the salt and hash with the secret in bcrypt.
    const passwordsMatch: boolean = await bcrypt.compare(password, user.password);

    // If the password does not match, ensure the user is told about the authentication failing.
    if (!passwordsMatch) {
        throw new ApiError({
            error: 'The provided username or password is not correct.',
            code: 400,
        });
    }

    const token = await AuthService.newToken(user);
    response.cookie('token', token, { domain: process.env.COOKIE_DOMAIN });

    user.lastSignIn = new Date();
    await user.save();

    response.json(flattenUser(user));
}

export async function logout(request: IRequest, response: Response) {
    request.user.token = null;
    await User.save(request.user);

    response.cookie('token', null, { domain: process.env.COOKIE_DOMAIN });
    return response.send();
}

/**
 * Called into with a authenticated user, if valid and logged in as expected, the current
 * authenticated user will be returned.
 *
 * @api {get} /auth/user Returns the current authenticated user.
 * @apiVersion 1.0.0
 * @apiName UserGathering
 * @apiGroup Authentication
 *
 * @apiSuccess {User} user The user who is authenticated.
 */
export async function currentUser(request: IRequest, response: Response) {
    return response.json(request.user);
}

export async function initiateEmailReset(request: IRequest, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findOne(request.user.id);
    const { password, email } = request.body;

    const passwordsMatch: boolean = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) throw new ApiError({ code: 400, error: 'Password did not match.' });

    await ResetService.resetEmail(user, email);

    return response.json({ message: 'Email reset.' });
}

export async function initiatePasswordReset(request: Request, response: Response) {
    const { username_or_email } = request.body;

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findByCredentials({ identifier: username_or_email });
    if (!user) throw new ApiError({ code: 404, error: 'User not found.' });

    const passwordResetRepository = getCustomRepository(PasswordResetRepository);
    await passwordResetRepository.delete({ user });

    await AuthService.resetPassword(user);

    return response.json({ message: 'Reset password, check your email.' });
}

export async function resetPassword(request: Request, response: Response) {
    const { token, password } = request.query;

    const passwordResetRepository = getCustomRepository(PasswordResetRepository);
    const passwordReset = await passwordResetRepository.findByToken(token);

    if (!passwordReset) throw new ApiError({ code: 400, error: 'Could not reset password' });

    if (Date.now() > passwordReset.expiresAt.getTime()) {
        throw new ApiError({ code: 401, error: 'Expired password reset token' });
    }

    const user = passwordReset.user;
    user.password = await hash(password);

    await getManager().transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.delete(PasswordReset, passwordReset.id);
        await transactionalEntityManager.save(user);
    });

    return response.json({ message: 'Password reset!' });
}
