import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';

import UserRepository from '../../repository/User.repository';
import { IUserRequest } from '../../request/IRequest';

export async function forUser(request: IUserRequest, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    const stats = await userRepository.findGameStatsByUser(request.boundUser);
    return response.json(stats);
}
