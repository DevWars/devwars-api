import { Request, Response } from 'express';

import UserProfile from '../../models/UserProfile';

interface IUpdateUserProfileRequest {
    firstName: string;
    lastName: string;
    dob: Date;
    about: string;
    forHire: boolean;
    websiteUrl: string;
    addressOne: string;
    addressTwo: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    skills: object;
}

export async function show(request: Request, response: Response) {
    const userId = request.params.id;
    const user = await UserProfile.findOne(userId);
    if (!user) return response.sendStatus(404);

    response.json(user);
}

export async function update(request: Request, response: Response) {
    const userId = request.params.id;
    const params = request.body as IUpdateUserProfileRequest;

    const user = await UserProfile.findOne(userId);
    if (!user) return response.sendStatus(404);

    Object.assign(user, params);
    await user.save();

    response.json(user);
}
