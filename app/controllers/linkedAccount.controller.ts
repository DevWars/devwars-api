import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import UserStatisticsRepository from '../repository/userStatistics.repository';
import LinkedAccountRepository from '../repository/linkedAccount.repository';
import UserRepository from '../repository/user.repository';

import LinkedAccount, { Provider } from '../models/linkedAccount.model';
import User from '../models/user.model';

import { SendLinkedAccountEmail, SendUnLinkedAccountEmail } from '../services/mail.service';
import { DiscordService } from '../services/discord.service';
import { TwitchService } from '../services/twitch.service';
import { BadgeService } from '../services/badge.service';

import { AuthorizedRequest, UserRequest } from '../request/requests';
import { parseStringWithDefault } from '../../test/helpers';
import ApiError from '../utils/apiError';
import { BADGES } from '../constants';

function getProviderFromString(provider: string) {
    switch (provider.toUpperCase()) {
        case 'TWITCH':
            return Provider.TWITCH;
        case 'DISCORD':
            return Provider.DISCORD;
    }

    return null;
}

async function connectTwitch(request: Request, response: Response, user: User): Promise<any> {
    // gather a given access token for the code that was returned back from twitch, completing
    // the linkage and authorization process with twitch.
    const token = await TwitchService.accessTokenForCode(request.query.code as string);
    if (_.isNil(token)) throw new ApiError({ error: 'Could not gather access token for Twitch.', code: 400 });

    // Attempt to gather the related users account information for the given token, this is what
    // will be used to link the accounts up with twitch.
    const twitchUser = await TwitchService.twitchUserForToken(token);
    if (_.isNil(twitchUser)) throw new ApiError({ error: 'Twitch user not found.', code: 403 });

    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
    let linkedAccount = await linkedAccountRepository.findByProviderAndProviderId(Provider.TWITCH, twitchUser.id);

    if (_.isNil(linkedAccount)) {
        linkedAccount = new LinkedAccount(user, twitchUser.username, Provider.TWITCH, twitchUser.id);
    }

    linkedAccount.user = user;
    linkedAccount.username = twitchUser.username;

    await linkedAccount.save();

    await SendLinkedAccountEmail(user, Provider.TWITCH);
    return response.redirect(`${process.env.FRONT_URL}/settings/connections`);
}

async function connectDiscord(request: Request, response: Response, user: User): Promise<any> {
    // gather a given access token for the code that was returned back from discord, completing
    // the linkage and authorization process with discord.
    const token = await DiscordService.accessTokenForCode(request.query.code as string);
    if (_.isNil(token)) throw new ApiError({ error: 'Could not gather access token for discord.', code: 400 });

    // Attempt to gather the related users account information for the given token, this is what
    // will be used to link the accounts up with discord.
    const discordUser = await DiscordService.discordUserForToken(token);
    if (_.isNil(discordUser)) throw new ApiError({ error: 'Discord user not found.', code: 403 });

    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
    let linkedAccount = await linkedAccountRepository.findByProviderAndProviderId(Provider.DISCORD, discordUser.id);

    if (_.isNil(linkedAccount)) {
        linkedAccount = new LinkedAccount(user, discordUser.username, Provider.DISCORD, discordUser.id);
    }

    linkedAccount.user = user;
    linkedAccount.username = discordUser.username;

    await linkedAccount.save();

    await SendLinkedAccountEmail(user, Provider.DISCORD);
    return response.redirect(`${process.env.FRONT_URL}/settings/connections`);
}

export async function connectToProvider(request: AuthorizedRequest, response: Response): Promise<any> {
    const provider = request.params.provider.toUpperCase();

    if (!(provider in Provider)) {
        throw new ApiError({ error: `${provider} is not a valid.`, code: 400 });
    }

    if (provider === Provider.DISCORD) return await connectDiscord(request, response, request.user);
    if (provider === Provider.TWITCH) return await connectTwitch(request, response, request.user);

    // award the social badge to the user.
    await BadgeService.awardBadgeToUserById(request.user, BADGES.SINGLE_SOCIAL_ACCOUNT);

    return response.redirect(`${process.env.FRONT_URL}/settings/connections`);
}

/**
 * @api {delete} /oauth/:provider Deletes a linked account from the given user
 * @apiDescription Called into when a user is disconnecting a linked account from there profile.
 * e.g removing a link between discord.
 * @apiName DeleteLinkedAccount
 * @apiGroup LinkedAccounts
 *
 * @apiParam {string} provider The name of the provider who is being removed.
 *
 * @apiSuccess {LinkedAccount} LinkedAccount The linked account that was removed.
 *
 * @apiError ProviderNotFound The provider is not a valid provider.
 * @apiError NoAccountLinkFound No link account between user and provider.
 */
export async function disconnectFromProvider(request: AuthorizedRequest, response: Response): Promise<any> {
    const provider = request.params.provider.toUpperCase();

    // if the given provider is not valid, then return out with a response to the user that the
    // given provider is not empty.
    if (!(provider in Provider)) throw new ApiError({ error: `${provider} is not a valid.`, code: 400 });

    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
    const linkedAccount = await linkedAccountRepository.findByUserIdAndProvider(request.user.id, provider);

    // if no link between the given account and the given sevice, let the user know of said link
    // that that it does not exist.
    if (_.isNil(linkedAccount)) {
        const error = `no linked account between user ${request.user.username} and provider ${provider}}`;
        throw new ApiError({ error, code: 404 });
    }

    // if the given user has any related storage on the linked account, don't remove it but unlink,
    // since the user could then again link it in the future, returning there coins back into once
    // they connect again.
    if (!_.isNil(linkedAccount.storage) && Object.keys(linkedAccount.storage).length > 0) {
        linkedAccount.user = null;
        await linkedAccount.save();
    } else {
        // Otherwise if no storage is provided, just go and remove it completely, since its the same
        // as just having a new linked account.
        await linkedAccount.remove();
    }

    await SendUnLinkedAccountEmail(request.user, provider);
    return response.json(linkedAccount);
}

export async function getCoinsForUserByProviderAndUserId(request: Request, response: Response): Promise<any> {
    const { provider, id } = request.params;

    const providerService = getProviderFromString(provider);
    const accountId = parseStringWithDefault(id, null, 1, 15);

    if (_.isNil(accountId) || _.isEmpty(accountId)) {
        throw new ApiError({
            message: 'The provider account id is not valid or not specified.',
            code: 400,
        });
    }

    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
    const userRepository = getCustomRepository(UserRepository);

    const account = await linkedAccountRepository.findOne({
        where: { providerId: accountId, provider: providerService },
        relations: ['user'],
    });

    if (_.isNil(account)) return response.json({ coins: 0 });

    let coins = 0;

    if (!_.isNil(account.user)) {
        const stats = await userRepository.findStatisticsForUser(account.user);
        coins = stats.coins;
    } else {
        coins = account.storage?.coins || 0;
    }

    return response.json({ coins });
}

export async function updateCoinsForUserByProviderAndUserId(request: Request, response: Response): Promise<any> {
    const { provider, id } = request.params;
    const { amount, username } = request.body;

    const providerService = getProviderFromString(provider);
    const accountId = parseStringWithDefault(id, null, 1, 15);

    if (_.isNil(accountId) || _.isEmpty(accountId)) {
        throw new ApiError({
            message: 'The provider account id is not valid or not specified.',
            code: 400,
        });
    }

    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
    const userStatisticsRepository = getCustomRepository(UserStatisticsRepository);

    const account = await linkedAccountRepository.createOrFindMissingAccount(username, accountId, providerService, [
        'user',
    ]);

    if (!_.isNil(account.user)) {
        // push it on the users statistics since they have there twitch accounts linked.
        await userStatisticsRepository.updateCoinsForUser(account.user, amount);
    } else {
        if (_.isNil(account.storage.coins)) account.storage.coins = 0;
        account.storage.coins += amount;
    }

    await LinkedAccount.save(account);
    return response.send();
}

/**
 * @api {get} /:user/connections Request all users linked accounts.
 * @apiName GetUsersConnections
 * @apiGroup User
 * @apiPermission owner/moderator
 *
 * @apiSuccess {json} LinkedAccounts The users linked accounts.
 *
 * @apiSuccessExample /:user/connections
 *     HTTP/1.1 200 OK
 * [{
 *     "username": "tehstun",
 *     "provider": "DISCORD",
 *     "providerId": "185840292463640576",
 *     "storage": {},
 *     "id": 693,
 *     "updatedAt": "2019-11-20T16:56:57.212Z",
 *     "createdAt": "2019-11-20T16:56:57.212Z"
 * }]
 */
export async function gatherAllUserConnectionsById(request: UserRequest, response: Response): Promise<any> {
    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);

    const connections = await linkedAccountRepository.findAllByUserId(request.boundUser.id);
    return response.json(connections);
}

/**
 * @api {get} /:user/connections/:provider Request all users linked accounts by provider.
 * @apiName GetUsersConnectionsByProvider
 * @apiGroup User
 * @apiPermission owner/moderator
 *
 * @apiSuccess {json} LinkedAccounts The users linked accounts.
 *
 * @apiSuccessExample /:user/connections/discord
 *     HTTP/1.1 200 OK
 * [{
 *     "username": "tehstun",
 *     "provider": "DISCORD",
 *     "providerId": "185840292463640576",
 *     "storage": {},
 *     "id": 693,
 *     "updatedAt": "2019-11-20T16:56:57.212Z",
 *     "createdAt": "2019-11-20T16:56:57.212Z"
 * }]
 */
export async function gatherAllUserConnectionsByProviderIdAndUserId(
    request: UserRequest,
    response: Response
): Promise<any> {
    const { provider } = request.params;

    if (_.isNil(provider) || !(provider.toUpperCase() in Provider))
        throw new ApiError({ error: `${provider} is not a valid provider.`, code: 400 });

    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
    const connection = await linkedAccountRepository.findByUserIdAndProvider(request.boundUser.id, provider);

    if (_.isNil(connection)) {
        const capitalizedProvider = `${provider[0].toUpperCase()}${provider.substring(1).toLowerCase()}`;
        const username = request.boundUser.username;

        throw new ApiError({
            error: `Connection does not exist for user ${username} with third-party ${capitalizedProvider}`,
            code: 404,
        });
    }

    return response.json(connection);
}
