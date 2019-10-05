import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import User from '../../models/User';
import { UserRole } from '../../models/User';
import UserRepository from '../../repository/User.repository';

import { isNil } from 'lodash';

interface IUpdateUserRequest {
    lastSigned: Date;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    token: string;
}

export async function show(request: Request, response: Response) {
    const user = await User.findOne(request.params.id);

    if (isNil(user)) return response.status(404).json({ error: 'User does not exist by the provided id.' });
    user.sanitize('email', 'lastSignIn', 'createdAt', 'updatedAt');

    return response.json(user);
}

export async function all(request: Request, response: Response) {
    const users = await User.find();

    users.forEach((element) => element.sanitize());

    return response.json(users);
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
