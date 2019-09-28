import { EntityRepository, Repository } from 'typeorm';
import User from '../models/User';
import UserProfile from '../models/UserProfile';
import UserStats from '../models/UserStats';
import UserGameStats from '../models/UserGameStats';
import GameSchedule from '../models/GameSchedule';
import GameApplication from '../models/GameApplication';

interface ICredentials {
    identifier: string;
}

@EntityRepository(User)
export default class UserRepository extends Repository<User> {
    public findByUsername(username: string): Promise<User> {
        username = username.toLowerCase();
        return User.findOne({ where: { username } });
    }

    /**
     * Finds a given user by there id.
     * @param id The id of the user being found.
     */
    public async findById(id: any): Promise<User> {
        return await User.findOne({ where: { id } });
    }

    public findByEmail(email: string): Promise<User> {
        return User.findOne({ where: { email } });
    }

    public findByToken(token: string): Promise<User> {
        return User.findOne({ where: { token } });
    }

    public async findByCredentials(request: ICredentials): Promise<User> {
        const byEmail = await this.findByEmail(request.identifier);
        if (byEmail) {
            return byEmail;
        }

        const byUsername = await this.findByUsername(request.identifier.toLowerCase());
        if (byUsername) {
            return byUsername;
        }

        return undefined;
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
