import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { isNil } from 'lodash';

import UserStats from '../../models/UserStats';
import UserRepository from '../../repository/User.repository';
import { Provider } from '../../models/LinkedAccount';
import LinkedAccountRepository from '../../repository/LinkedAccount.repository';
import { IUserRequest } from '../../request/IRequest';
import ApiError from '../../utils/apiError';

export async function forUser(request: IUserRequest, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    const stats = await userRepository.findStatsByUser(request.boundUser);

    return response.json(stats);
}

export async function create(request: IUserRequest, response: Response) {
    const existingStatus = await UserStats.findOne({ where: { user: request.boundUser.id } });

    if (!isNil(existingStatus)) {
        throw new ApiError({
            error: `The user ${request.boundUser.username} already has existing user stats.`,
            code: 409,
        });
    }

    const stats = new UserStats();
    stats.user = request.boundUser;

    Object.assign(stats, request.body);

    await stats.save();
    return response.json(stats);
}

export async function getCoins(request: Request, response: Response) {
    const { twitchId } = request.query;
    let coins = 0;

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(request.cookies.token);
    if (user) {
        const stats = await userRepository.findStatsByUser(user);
        coins += stats.coins;
    }

    if (twitchId) {
        const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
        const account = await linkedAccountRepository.findByProviderAndProviderId(Provider.TWITCH, twitchId);

        if (account && account.storage && account.storage.coins) {
            coins += account.storage.coins;
        }

        if (!user && account.user) {
            const stats = await userRepository.findStatsByUser(account.user);
            coins += stats.coins;
        }
    }

    return response.json(coins);
}
