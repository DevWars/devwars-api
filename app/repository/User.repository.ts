import {User} from "../models";

import ILoginRequest from "../request/ILoginRequest";

export class UserRepository {

    public static async userForCredentials(request: ILoginRequest): Promise<User> {
        const byEmail = await UserRepository.byEmail(request.identifier);

        if (byEmail) {
            return byEmail;
        }

        const byUsername = await UserRepository.byUsername(request.identifier);

        if (byUsername) {
            return byUsername;
        }

        return undefined;
    }

    public static async userForToken(token: string): Promise<User> {
        return User.createQueryBuilder().where({token}).getOne();
    }

    public static byEmail(email: string): Promise<User> {
        return User.createQueryBuilder().where("LOWER(email) = LOWER(:email)", {email}).getOne();
    }

    public static byUsername(username: string): Promise<User> {
        return User.createQueryBuilder().where("LOWER(username) = LOWER(:username)", {username}).getOne();
    }

    public static byId(id: number): Promise<User> {
        return User.findOne(id);
    }
}
