import {Request, Response} from "express";

import ILoginRequest from "../../request/ILoginRequest";
import IRegistrationRequest from "../../request/RegistrationRequest";

import * as bcrypt from "bcrypt";

import {AuthService} from "../../services/Auth.service";

import {EmailVerification, UserRole} from "../../models";
import {UserRepository} from "../../repository";
import {VerificationService} from "../../services/Verification.service";

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
        const {username, email, password}: IRegistrationRequest = request.body;

        const user = await AuthService.register({username, email, password});

        response.cookie("auth", await AuthService.newToken(user), {domain: process.env.COOKIE_DOMAIN});

        response.json(user);
    }

    public static async reVerify(request: Request, response: Response) {
       const user = await UserRepository.userForToken(request.cookies.auth);

       await VerificationService.reset(user);

       response.json({
           message: "Resent",
       });
    }

    public static async verify(request: Request, response: Response) {
        const {key} = request.query;
        const redirectUrl = `${process.env.FRONT_URL}`;

        const foundToken = await EmailVerification.findOne({where: {token: key}});

        if (foundToken) {
            const {user} = foundToken;

            user.role = UserRole.USER;

            await user.save();
            await foundToken.remove();
        }

        response.redirect(redirectUrl);
    }

    public static async login(request: Request, response: Response) {
        const user = await UserRepository.userForCredentials(request.body as ILoginRequest);

        const passwordsMatch: boolean = await bcrypt.compare(request.body.password, user.password);

        if (!passwordsMatch) {
            response.status(400).send({error: "Invalid Credentials"});
        } else {
            const token = await AuthService.newToken(user);

            response.cookie("auth", token, {domain: process.env.COOKIE_DOMAIN});

            response.json(user);
        }
    }

    public static async logout(request: Request, response: Response) {
        response.cookie("auth", null, {domain: process.env.COOKIE_DOMAIN});

        response.json({
            message: "Success",
        });
    }

    public static async currentUser(request: Request, response: Response) {
        const token = request.cookies.auth;
        const user = await UserRepository.userForToken(token);

        if (!user) {
            response.status(404).send("You are not logged in");
        }

        response.json(user);
    }
}
