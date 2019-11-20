import { EntityRepository, Repository } from 'typeorm';
import User from '../models/User';
import UserProfile from '../models/UserProfile';
import UserStats from '../models/UserStats';
import UserGameStats from '../models/UserGameStats';
import GameSchedule from '../models/GameSchedule';
import GameApplication from '../models/GameApplication';

import * as _ from 'lodash';

interface ICredentials {
    identifier: string;
}

@EntityRepository(User)
export default class UserRepository extends Repository<User> {
    /**
     * Finds a given user by there id.
     * @param id The id of the user being found.
     */
    public async findById(id: any): Promise<User> {
        return await User.findOne({ where: { id } });
    }

    public findByEmail(email: string): Promise<User> {
        return User.createQueryBuilder()
            .where('LOWER(email) = LOWER(:email)', { email })
            .getOne();
    }

    public findByUsername(username: string): Promise<User> {
        return User.createQueryBuilder()
            .where('LOWER(username) = LOWER(:username)', { username })
            .getOne();
    }

    public findByToken(token: string): Promise<User> {
        return User.findOne({ where: { token } });
    }

    /**
     *  Attempts to find a given user by the email address or the username. If found the whole user
     *  object is returned otherwise null.
     *  @param request The requesting information for the given user.
     */
    public async findByCredentials(request: ICredentials): Promise<User> {
        const byEmail = await this.findByEmail(request.identifier);
        if (!_.isNil(byEmail)) return byEmail;

        // Username is forced to be lowercase, this must be enforced
        const byUsername = await this.findByUsername(request.identifier);

        // Falling back to the username, this could be undefined but should be handled by the
        // calling operation and not here.
        return byUsername;
    }

    public findProfileByUser(user: User): Promise<UserProfile> {
        return UserProfile.findOne({ user });
    }

    public async findStatsByUser(user: User): Promise<any> {
        const [stats, game] = await Promise.all([UserStats.findOne({ user }), UserGameStats.findOne({ user })]);

        return { ...stats, game };
    }

    public findGameStatsByUser(user: User): Promise<UserGameStats> {
        return UserGameStats.findOne({ user });
    }

    public async findApplicationsBySchedule(schedule: GameSchedule): Promise<User[]> {
        if (_.isNil(schedule)) return null;

        return User.createQueryBuilder('user')
            .where((qb) => {
                const subQuery = qb
                    .subQuery()
                    .select('application.user_id')
                    .from(GameApplication, 'application')
                    .where('application.schedule_id = :schedule')
                    .getSql();

                return 'user.id in ' + subQuery;
            })
            .setParameter('schedule', schedule.id)
            .getMany();
    }
}
