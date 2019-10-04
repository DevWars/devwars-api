import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import User from '../../models/User';
import { UserRole } from '../../models/User';
import UserRepository from '../../repository/User.repository';
import { AuthService } from '../../services/Auth.service';

interface IUpdateUserRequest {
    lastSigned: Date;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    token: string;
}

export async function show(request: Request, response: Response) {
    const userId = request.params.id;
    const user = await User.findOne(userId);
    if (!user) return response.sendStatus(404);

    response.json(AuthService.sanitizeUser(user, ['email', 'lastSignIn', 'createdAt', 'updatedAt']));
}

export async function all(request: Request, response: Response) {
    const users = await User.find();

    response.json(users.map((user) => AuthService.sanitizeUser(user)));
}

export async function update(request: Request, response: Response) {
    const userId = request.params.id;
    const params = request.body as IUpdateUserRequest;

    const user = await User.findOne(userId);
    if (!user) return response.sendStatus(404);

    const userRepository = getCustomRepository(UserRepository);
    const existingUsername = await userRepository.findByUsername(params.username);
    if (existingUsername && existingUsername.id !== user.id) {
        return response.status(409).send({ message: 'Username already taken' });
    }

    Object.assign(user, params);
    await user.save();

    response.json(user);
}
