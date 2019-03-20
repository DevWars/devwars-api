import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import LinkedAccountRepository from '../../repository/LinkedAccount.repository';
import UserRepository from '../../repository/User.repository';

export class LinkedAccountController {
    public static async all(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findOne(request.params.id);
        if (!user) return response.sendStatus(404);

        const linkedAccountRepository = await getCustomRepository(LinkedAccountRepository);
        const accounts = await linkedAccountRepository.findAllByUserId(user.id);

        response.json(accounts);
    }

    public static async remove(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findOne(request.params.id);
        if (!user) return response.sendStatus(404);

        const linkedAccountRepository = await getCustomRepository(LinkedAccountRepository);
        const accounts = await linkedAccountRepository.findAllByUserId(user.id);

        for (const account of accounts) {
            await account.remove();
        }

        response.json(accounts);
    }
}
