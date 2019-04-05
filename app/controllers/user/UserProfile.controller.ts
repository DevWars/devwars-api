import { Request, Response } from 'express';

import UserProfile from '../../models/UserProfile';
import { IProfileRequest } from '../../request/IProfileRequest';

export async function show(request: Request, response: Response) {
    const userId = request.params.id;
    const user = await UserProfile.findOne(userId);
    if (!user) return response.sendStatus(404);

    response.json(user);
}

export async function update(request: Request, response: Response) {
    const userId = request.params.id;
    const params : any = { ...request.body as IProfileRequest};

    let data : any = await UserProfile.findOne({
        where: {
            user: userId
        }
    });

    if (!data) return response.sendStatus(404);

    Object.keys(data).map(k => {
        if (params[k]) data[k] = params[k];
    })

    data = await UserProfile.save(data);
    return response.json(data);
}
