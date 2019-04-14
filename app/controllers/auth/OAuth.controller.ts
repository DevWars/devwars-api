import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import LinkedAccount, { Provider } from '../../models/LinkedAccount';
import UserRepository from '../../repository/User.repository';
import { DiscordService } from '../../services/Discord.service';

export class OAuthController {
    public static async discord(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(request.cookies.auth);
        const token = await DiscordService.accessTokenForCode(request.query.code);

        if (!token) {
            return response.status(400).json({
                message: 'Missing token',
            });
        }

        const discordUser = await DiscordService.discordUserForToken(token);

        if (!discordUser) {
            response.status(403).json({
                message: 'Discord user not found',
            });
        }

        const linked = new LinkedAccount();
        linked.user = user;
        linked.provider = Provider.DISCORD;
        linked.username = discordUser.username;
        linked.providerId = discordUser.id;

        await linked.save();

        response.redirect(`${process.env.FRONT_URL}/settings/connections`);
    }
}
