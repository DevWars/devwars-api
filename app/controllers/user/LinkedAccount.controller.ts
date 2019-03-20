import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import LinkedAccountRepository from '../../repository/LinkedAccount.repository';
import UserRepository from '../../repository/User.repository';

export class LinkedAccountController {
    public static async all(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findOne(request.params.user.id);
        if (!user) return response.status(404).json({ message: 'User not found' });

        const linkedAccountRepository = await getCustomRepository(LinkedAccountRepository);
        const accounts = await linkedAccountRepository.findAllByUserId(user.id);
        if (accounts.length === 0) {
            return response.status(404).json({
                message: 'No accounts linked with user',
            });
        }

        response.json(accounts);
    }

    public static async remove(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findOne(request.params.user.id);
        if (!user) return response.status(503).json({ message: 'User not found' });

        const linkedAccountRepository = await getCustomRepository(LinkedAccountRepository);
        const accounts = await linkedAccountRepository.findAllByUserId(user.id);
        if (accounts.length === 0) {
            return response.status(503).json({
                message: 'No accounts linked with user',
            });
        }

        for (const account of accounts) {
            await account.remove();
        }

        response.json(accounts);
    }
}
