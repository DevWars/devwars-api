import { EntityRepository, Repository } from 'typeorm';
import User from '../models/User';
import UserStats from '../models/UserStats';
import UserGameStats from '../models/UserGameStats';

import * as _ from 'lodash';

interface Credentials {
    identifier: string;
}

@EntityRepository(User)
export default class UserRepository extends Repository<User> {
    /**
     * Finds a given user by there id.
     * @param id The id of the user being found.
     */
    public async findById(id: any): Promise<User> {
        return await this.findOne({ where: { id } });
    }

    /**
     * Attempts to find a given user by the email.
     * @param email The email of the given user.
     */
    public findByEmail(email: string): Promise<User> {
        return this.createQueryBuilder().where('LOWER(email) = LOWER(:email)', { email }).getOne();
    }

    /**
     * Attempts to find a user by a given username.
     * @param username The username of the given user.
     */
    public findByUsername(username: string): Promise<User> {
        return this.createQueryBuilder().where('LOWER(username) = LOWER(:username)', { username }).getOne();
    }

    /**
     * Finds a given user by a email or username, ensuring that they are done lowercase.
     * @param username The username of the given user.
     * @param email The email of the given user.
     */
    public findByUsernameOrEmail(username: string, email: string): Promise<User> {
        return this.createQueryBuilder()
            .where('LOWER(username) = LOWER(:username)', { username })
            .orWhere('LOWER(email) = LOWER(:email)', { email })
            .getOne();
    }

    /**
     * Returns true if and only if a user already has the assigned email address, regardless of case.
     * @param email The email address to check if its in use or not.
     */
    public async userExistsWithEmail(email: string): Promise<boolean> {
        const totalExist = await this.createQueryBuilder().where('LOWER(email) = LOWER(:email)', { email }).getCount();

        return totalExist >= 1;
    }

    /**
     * Finds the user by a given authentication token.
     * @param token The authentication token for the given user.
     */
    public findByToken(token: string): Promise<User> {
        return this.findOne({ where: { token } });
    }

    /**
     *  Attempts to find a given user by the email address or the username. If found the whole user
     *  object is returned otherwise null.
     *  @param request The requesting information for the given user.
     */
    public async findByCredentials(request: Credentials): Promise<User> {
        const byEmail = await this.findByEmail(request.identifier);
        if (!_.isNil(byEmail)) return byEmail;

        // Username is forced to be lowercase, this must be enforced
        const byUsername = await this.findByUsername(request.identifier);

        // Falling back to the username, this could be undefined but should be handled by the
        // calling operation and not here.
        return byUsername;
    }

    /**
     * Attempts to find all the users that have a username/email (This is hard
     * limited by the given limit provided but will fall back onto a hard limit of 50 if not
     * specified.
     *
     * @param username The username that will be performed in the given *like* match.
     * @param email The email that will be performed in the given *like* match.
     * @param limit The upper limit of the number of users to gather based on the likeness.
     */
    public async getUsersLikeUsernameOrEmail(
        username: string,
        email: string,
        limit = 50,
        relations: string[]
    ): Promise<User[]> {
        let query = this.createQueryBuilder('user');

        if (!_.isEmpty(username))
            query = query.where('LOWER(user.username) LIKE :username', { username: `%${username.toLowerCase()}%` });

        if (!_.isEmpty(email))
            query = query.orWhere('LOWER(user.email) LIKE :email', { email: `%${email.toLowerCase()}%` });

        _.forEach(relations, (relation) => (query = query.leftJoinAndSelect(`user.${relation}`, relation)));
        return query.take(limit).getMany();
    }

    public async findStatsByUser(user: User) {
        const [stats, game] = await Promise.all([UserStats.findOne({ user }), UserGameStats.findOne({ user })]);
        return { ...stats, game };
    }

    public findGameStatsByUser(user: User): Promise<UserGameStats> {
        return UserGameStats.findOne({ user });
    }
}
