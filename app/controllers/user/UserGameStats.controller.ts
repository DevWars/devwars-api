import { Response } from 'express';
import { getCustomRepository } from 'typeorm';

import UserRepository from '../../repository/User.repository';
import { UserRequest } from '../../request/IRequest';

export async function forUser(request: UserRequest, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    const stats = await userRepository.findGameStatsByUser(request.boundUser);
    return response.json(stats);
}
