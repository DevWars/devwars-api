import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import LinkedAccount, { Provider } from '../../models/LinkedAccount';
import LinkedAccountRepository from '../../repository/LinkedAccount.repository';
import { DiscordService } from '../../services/Discord.service';
import User from '../../models/User';

import { IRequest } from '../../request/IRequest';
import * as _ from 'lodash';

export class LinkedAccountController {
    public static async all(request: IRequest, response: Response) {
        const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
        const accounts = await linkedAccountRepository.findAllByUserId(request.user.id);

        response.json(accounts);
    }

    public static async connect(request: IRequest, response: Response) {
        const provider = request.params.provider.toUpperCase();

        if (!(provider in Provider))
            return response.status(400).json({ message: `${provider} is not a valid Provider` });

        if (provider === Provider.DISCORD) {
            await LinkedAccountController.connectDiscord(request, response, request.user);
        }

        response.redirect(`${process.env.FRONT_URL}/settings/connections`);
    }

    public static async disconnect(request: IRequest, response: Response) {
        const provider = request.params.provider.toUpperCase();

        if (!(provider in Provider)) {
            return response.status(400).json({ message: `${provider} is not a valid Provider` });
        }

        const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
        const account = await linkedAccountRepository.findByUserIdAndProvider(request.user.id, provider);

        if (_.isNil(account)) return response.sendStatus(404);

        account.user = null;
        await account.save();

        response.json(account);
    }

    public static async updateTwitchCoins(request: Request, response: Response) {
        const { twitchUser, amount } = request.body;

        if (!twitchUser && !twitchUser.id && !twitchUser.username) {
            return response.status(400).json({ message: 'User not provided' });
        }

        if (!amount) {
            return response.status(400).json({ message: 'Amount not provided' });
        }

        const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
        let account = await linkedAccountRepository.findByProviderAndProviderId(Provider.TWITCH, twitchUser.id);

        if (!account) {
            account = new LinkedAccount();
            account.provider = Provider.TWITCH;
            account.providerId = twitchUser.id;
            account.storage = {};
        }

        account.username = twitchUser.username;

        if (account.storage && account.storage.coins) {
            account.storage.coins += amount;
        } else {
            account.storage.coins = amount;
        }

        await account.save();

        response.json(account);
    }

    private static async connectDiscord(request: Request, response: Response, user: User) {
        // gather a given access token for the code that was returned back from discord, completing
        // the linkage and authorization process with discord.
        const token = await DiscordService.accessTokenForCode(request.query.code);
        if (_.isNil(token)) return response.status(400).json({ error: 'could not gather access token for discord.' });

        // Attempt to gather the relatd users account information for the tiven token, this is what
        // will be used to link the accounts up with discord.
        const discordUser = await DiscordService.discordUserForToken(token);
        if (_.isNil(discordUser)) return response.status(403).json({ error: 'Discord user not found.' });

        const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
        let account = await linkedAccountRepository.findByProviderAndProviderId(Provider.DISCORD, discordUser.id);

        if (_.isNil(account)) {
            account = new LinkedAccount();
            account.provider = Provider.DISCORD;
            account.providerId = discordUser.id;
            account.storage = {};
        }

        account.user = user;
        account.username = discordUser.username;

        await account.save();
    }
}
