import { EntityRepository, Repository } from 'typeorm';
import { GameApplication, User, UserProfile } from '../models';

interface ICredentials {
    identifier: string;
}

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    public findByUsername(username: string): Promise<User> {
        return User.findOne({ where: { username } });
    }

    public findByEmail(email: string): Promise<User> {
        return User.findOne({ where: { email } });
    }

    public findByToken(token: string): Promise<User> {
        return User.findOne({ where: { token } });
    }

    public findByProfile(user: User): Promise<UserProfile> {
        return UserProfile.findOne(user.id);
    }

    public async findByCredentials(request: ICredentials): Promise<User> {
        const byEmail = await this.findByEmail(request.identifier);
        if (byEmail) {
            return byEmail;
        }

        const byUsername = await this.findByUsername(request.identifier);
        if (byUsername) {
            return byUsername;
        }

        return undefined;
    }
}

// public static async byAppliedGame(game: Game): Promise<User[]> {
//     return User.createQueryBuilder('user')
//         .where((qb) => {
//             const subQuery = qb.subQuery()
//                 .select('application.user_id')
//                 .from(GameApplication, 'application')
//                 .where('application.game_id = :game')
//                 .getSql();

//             return 'user.id in ' + subQuery;
//         })
//         .setParameter('game', game.id)
//         .getMany();
// }
