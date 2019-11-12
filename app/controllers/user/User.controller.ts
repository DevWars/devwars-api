import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import { isNil } from 'lodash';

import User from '../../models/User';
import { UserRole } from '../../models/User';
import UserRepository from '../../repository/User.repository';
import { IRequest } from '../../request/IRequest';
import { hash } from '../../utils/hash';

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
    const sanitizedUser = user.sanitize('email', 'lastSignIn', 'createdAt', 'updatedAt');

    return response.json(sanitizedUser);
}

export async function all(request: Request, response: Response) {
    const users = await User.find();
    return response.json(users);
}

export async function update(request: IRequest, response: Response) {
    const params = request.body as IUpdateUserRequest;

    const userRepository = getCustomRepository(UserRepository);
    const existingUsername = await userRepository.findByUsername(params.username);

    if (!isNil(existingUsername) && existingUsername.id !== request.user.id) {
        return response.status(409).send({
            message: 'The provided username already exists for a registered user.',
        });
    }

    // Ensure to encrypt the updated password if it has been specified.
    if (!isNil(params.password)) params.password = await hash(params.password);

    Object.assign(request.user, params);
    await request.user.save();

    return response.json(request.user);
}
