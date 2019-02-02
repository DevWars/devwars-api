import {Request, Response} from "express";
import {DiscordService} from "../../services/Discord.service";

import {LinkedAccount} from "../../models";
import {UserRepository} from "../../repository";

export class OAuthController {

    public static async discord(request: Request, response: Response) {
        const user = await UserRepository.userForToken(request.cookies.auth);
        const token = await DiscordService.accessTokenForCode(request.query.code);

        if (!token) {
            return response.status(400).json({
                message: "Missing token",
            });
        }

        const discordUser = await DiscordService.discordUserForToken(token);

        if (!discordUser) {
            response.status(403).json({
                message: "Discord user not found",
            });
        }

        const linked = new LinkedAccount();
        linked.user = user;
        linked.provider = "DISCORD";
        linked.username = discordUser.username;
        linked.providerId = discordUser.id;

        await linked.save();

        response.redirect(`${process.env.FRONT_URL}/settings/connections`);
    }
}
