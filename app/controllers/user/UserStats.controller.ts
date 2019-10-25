import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import UserStats from '../../models/UserStats';
import UserRepository from '../../repository/User.repository';
import LinkedAccount, { Provider } from '../../models/LinkedAccount';
import LinkedAccountRepository from '../../repository/LinkedAccount.repository';

export async function forUser(request: Request, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findOne(request.params.id);
    if (!user) return response.sendStatus(404);

    const stats = await userRepository.findStatsByUser(user);

    response.json(stats);
}

export async function create(request: Request, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findOne(request.params.id);
    if (!user) return response.sendStatus(400);

    const stats = new UserStats();
    stats.user = user;
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
