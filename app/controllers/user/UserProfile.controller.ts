import { Request, Response } from 'express';
import * as _ from 'lodash';

import UserProfile from '../../models/UserProfile';
import { IProfileRequest } from '../../request/IProfileRequest';
import { IUserRequest } from '../../request/IRequest';

export async function show(request: IUserRequest, response: Response) {
    const profile = await UserProfile.findOne({ where: { user: request.boundUser.id } });

    if (_.isNil(profile)) {
        return response.status(404).json({
            error: `The specified user ${request.boundUser.username} does not have a profile`,
        });
    }

    return response.json(profile);
}

export async function update(request: IUserRequest, response: Response) {
    const params: any = { ...(request.body as IProfileRequest) };
    const profile: any = await UserProfile.findOne({ where: { user: request.boundUser.id } });

    if (_.isNil(profile)) {
        return response.status(404).json({
            error: `The specified user ${request.boundUser.username} does not have a profile`,
        });
    }

    Object.keys(profile).map((k) => {
        if (!_.isNil(params[k])) profile[k] = params[k];
    });

    const updatedProfile = await UserProfile.save(profile);
    return response.json(updatedProfile);
}
