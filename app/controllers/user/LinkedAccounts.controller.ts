import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { LinkedAccountRepository, UserRepository } from '../../repository';

export class LinkedAccountsController {
    public static async all(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findOne(request.params.user.id);

        const accounts = await LinkedAccountRepository.forUser(user);

        response.json(accounts);
    }

    public static async remove(request: Request, response: Response) {
        const userRepository = await getCustomRepository(UserRepository);
        const user = await userRepository.findOne(request.params.user.id);

        const accounts = await LinkedAccountRepository.forUser(user);

        for (const account of accounts) {
            await account.remove();
        }

        response.json(accounts);
    }
}
