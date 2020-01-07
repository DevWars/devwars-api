import { Request, Response } from 'express';
import { getCustomRepository, In } from 'typeorm';
import LinkedAccount, { Provider } from '../../models/LinkedAccount';
import LinkedAccountRepository from '../../repository/LinkedAccount.repository';
import { DiscordService } from '../../services/Discord.service';
import User from '../../models/User';

import { IRequest } from '../../request/IRequest';
import * as _ from 'lodash';
import { SendLinkedAccountEmail, SendUnLinkedAccountEmail } from '../../services/Mail.service';

export async function all(request: IRequest, response: Response) {
    const accounts = await LinkedAccount.find();

    return response.json(accounts);
}

export async function connect(request: IRequest, response: Response) {
    const provider = request.params.provider.toUpperCase();

    if (!(provider in Provider)) return response.status(400).json({ error: `${provider} is not a valid.` });
    if (provider === Provider.DISCORD) return await connectDiscord(request, response, request.user);

    return response.redirect(`${process.env.FRONT_URL}/settings/connections`);
}

/**
 * @api {delete} /oauth/:provider Deletes a linked account from the given user
 * @apiDescription Called into when a user is disconnecting a linked account from there profile.
 * e.g removing a link between discord.
 * @apiName DeleteLinkedAccount
 * @apiGroup LinkedAccounts
 *
 * @apiParam {string} Provider The name of the provider who is being removed.
 *
 * @apiSuccess {json} LinkedAccount The linked account that was removed.
 *
 * @apiError ProviderNotFound The provider is not a valid provider.
 * @apiError NoAccountLinkFound No link account between user and provider.
 */
export async function disconnect(request: IRequest, response: Response) {
    const provider = request.params.provider.toUpperCase();

    // if the given provider is not valid, then return out with a response to the user that the
    // given provider is not empty.
    if (!(provider in Provider)) return response.status(400).json({ error: `${provider} is not a valid.` });

    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
    const linkedAccount = await linkedAccountRepository.findByUserIdAndProvider(request.user.id, provider);

    // if no link between the given account and the given sevice, let the user know of said link
    // that that it does not exist.
    if (_.isNil(linkedAccount)) {
        const error = `no linked account between user ${request.user.username} and provider ${provider}}`;
        return response.status(404).send({ error });
    }

    await linkedAccount.remove();

    await SendUnLinkedAccountEmail(linkedAccount);
    return response.json(linkedAccount);
}

export async function updateTwitchCoins(request: Request, response: Response) {
    const twitchUsers = request.body.updates.map((update: any) => update.twitchUser);

    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
    await linkedAccountRepository.createMissingAccounts(twitchUsers, Provider.TWITCH);

    const accounts = await LinkedAccount.find({ providerId: In(twitchUsers.map((u: any) => u.id)) });
    for (const account of accounts) {
        const { amount } = request.body.updates.find((update: any) => update.twitchUser.id === account.providerId);
        if (!_.isFinite(amount)) continue;

        if (_.isNil(account.storage.coins)) account.storage.coins = 0;
        account.storage.coins += amount;
    }

    await LinkedAccount.save(accounts);

    return response.json(accounts);
}

async function connectDiscord(request: Request, response: Response, user: User) {
    // gather a given access token for the code that was returned back from discord, completing
    // the linkage and authorization process with discord.
    const token = await DiscordService.accessTokenForCode(request.query.code);
    if (_.isNil(token)) return response.status(400).json({ error: 'Could not gather access token for discord.' });

    // Attempt to gather the related users account information for the given token, this is what
    // will be used to link the accounts up with discord.
    const discordUser = await DiscordService.discordUserForToken(token);
    if (_.isNil(discordUser)) return response.status(403).json({ error: 'Discord user not found.' });

    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
    let linkedAccount = await linkedAccountRepository.findByProviderAndProviderId(Provider.DISCORD, discordUser.id);

    if (_.isNil(linkedAccount)) {
        linkedAccount = new LinkedAccount(user, discordUser.username, Provider.DISCORD, discordUser.id);
    }

    linkedAccount.user = user;
    linkedAccount.username = discordUser.username;

    await linkedAccount.save();

    await SendLinkedAccountEmail(linkedAccount);
    return response.redirect(`${process.env.FRONT_URL}/settings/connections`);
}
