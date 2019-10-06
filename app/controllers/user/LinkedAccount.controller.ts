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

        if (!(provider in Provider)) return response.status(400).json({ error: `${provider} is not a valid.` });

        if (provider === Provider.DISCORD) {
            await LinkedAccountController.connectDiscord(request, response, request.user);
        }

        response.redirect(`${process.env.FRONT_URL}/settings/connections`);
    }

    /**
     * @api {delete} /oauth/:provider Deletes a linked account from teh given user
     * @apiName DeleteLinkedAccounst
     * @apiGroup LinkedAccounts
     * @apiDescription Called into when a user is diconnecting a linked account from there profile.
     * e.g removing a link between discord.
     *
     * @apiParam {string} The name of the provider who is being removed.
     *
     * @apiSuccess {json} The linked account that was removed.
     * @apiError ProviderNotFound The provider is not a valid provider.
     * @apiError NoAccountLinkFound No link account between user and provider.
     */
    public static async disconnect(request: IRequest, response: Response) {
        const provider = request.params.provider.toUpperCase();

        // if the given provider is not valid, then return out with a response to the user that the
        // given provider is not empty.
        if (!(provider in Provider)) return response.status(400).json({ error: `${provider} is not a valid.` });

        const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
        const account = await linkedAccountRepository.findByUserIdAndProvider(request.user.id, provider);

        // if no link between the given account and the given sevice, let the user know of said link
        // that that it does not exist.
        if (_.isNil(account)) {
            const error = `no linked account between user ${request.user.username} and provider ${provider}}`;
            return response.sendStatus(404).send({ error });
        }

        await account.remove();
        return response.json(account);
    }

    public static async updateTwitchCoins(request: Request, response: Response) {
        const { twitchUser, amount } = request.body;

        if (!twitchUser && !twitchUser.id && !twitchUser.username) {
            return response.status(400).json({ error: 'User not provided.' });
        }

        if (!amount) {
            return response.status(400).json({ error: 'Amount not provided.' });
        }

        const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
        let account = await linkedAccountRepository.findByProviderAndProviderId(Provider.TWITCH, twitchUser.id);

        if (!account) {
            account = new LinkedAccount();
            account.provider = Provider.TWITCH;
            account.providerId = twitchUser.id;
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
        if (_.isNil(token)) return response.status(400).json({ error: 'Could not gather access token for discord.' });

        // Attempt to gather the related users account information for the given token, this is what
        // will be used to link the accounts up with discord.
        const discordUser = await DiscordService.discordUserForToken(token);
        if (_.isNil(discordUser)) return response.status(403).json({ error: 'Discord user not found.' });

        const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
        let account = await linkedAccountRepository.findByProviderAndProviderId(Provider.DISCORD, discordUser.id);

        if (_.isNil(account)) {
            account = new LinkedAccount();
            account.provider = Provider.DISCORD;
            account.providerId = discordUser.id;
        }

        account.user = user;
        account.username = discordUser.username;

        await account.save();
    }
}
