import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import LinkedAccount, { Provider } from '../../models/LinkedAccount';
import LinkedAccountRepository from '../../repository/LinkedAccount.repository';
import UserRepository from '../../repository/User.repository';
import { DiscordService } from '../../services/Discord.service';
import User from '../../models/User';

export class LinkedAccountController {
    public static async all(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(request.cookies.token);
        if (!user) return response.sendStatus(404);

        const linkedAccountRepository = await getCustomRepository(LinkedAccountRepository);
        const accounts = await linkedAccountRepository.findAllByUserId(user.id);

        response.json(accounts);
    }

    public static async connect(request: Request, response: Response) {
        const provider = request.params.provider.toUpperCase();

        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(request.cookies.token);
        if (!user) return response.sendStatus(404);

        if (!(provider in Provider)) {
            return response.status(400).json({ message: `${provider} is not a valid Provider` });
        }

        if (provider === Provider.DISCORD) {
            await LinkedAccountController.connectDiscord(request, response, user);
        }

        response.redirect(`${process.env.FRONT_URL}/settings/connections`);
    }

    public static async disconnect(request: Request, response: Response) {
        const provider = request.params.provider.toUpperCase();

        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findByToken(request.cookies.token);
        if (!user) return response.sendStatus(404);

        if (!(provider in Provider)) {
            return response.status(400).json({ message: `${provider} is not a valid Provider` });
        }

        const linkedAccountRepository = await getCustomRepository(LinkedAccountRepository);
        const account = await linkedAccountRepository.findByUserIdAndProvider(user.id, provider);
        if (!account) return response.sendStatus(404);

        account.user = null;
        await account.save();

        response.json(account);
    }

    public static async updateTwitchCoins(request: Request, response: Response) {
        //
    }

    private static async connectDiscord(request: Request, response: Response, user: User) {
        const token = await DiscordService.accessTokenForCode(request.query.code);
        if (!token) {
            return response.status(400).json({ message: 'Missing token' });
        }

        const discordUser = await DiscordService.discordUserForToken(token);
        if (!discordUser) {
            return response.status(403).json({ message: 'Discord user not found' });
        }

        const linkedAccountRepository = await getCustomRepository(LinkedAccountRepository);
        let account = await linkedAccountRepository.findByProviderAndProviderId(Provider.DISCORD, discordUser.id);

        if (!account) {
            account = new LinkedAccount();
        }

        account.user = user;
        account.provider = Provider.DISCORD;
        account.username = discordUser.username;
        account.providerId = discordUser.id;

        await account.save();
    }
}
