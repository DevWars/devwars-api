import {BADGES} from '../app/constants';
import {MigrationInterface, QueryRunner, MoreThanOrEqual} from 'typeorm';

import BadgeRepository from '../app/repository/badge.repository';
import UserGameStatsRepository from '../app/repository/userGameStats.repository';

export class UserWinStreaks1604857327674 implements MigrationInterface {
    name = 'userWinStreaks1604857327674'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "user" ALTER COLUMN "lastUsernameUpdateAt" SET DEFAULT null');

      await queryRunner.query('ALTER TABLE user_game_stats ADD COLUMN win_streak integer');
      await queryRunner.query('ALTER TABLE "user_game_stats" ALTER COLUMN "win_streak" SET DEFAULT 0');

      // Set all the values to zero and then update every single user who has not lost a game to be equal total
      // the number of games they have won. This we can determine but other operations cannot since we don't
      // know if the last game was a loss or not.
      await queryRunner.query('UPDATE user_game_stats SET win_streak = 0');
      await queryRunner.query('UPDATE user_game_stats SET win_streak = user_game_stats.wins WHERE loses = 0');
      await queryRunner.query('ALTER TABLE "user_game_stats" ALTER COLUMN "win_streak" SET NOT NULL');


      const badgeRepository = queryRunner.manager.getCustomRepository(BadgeRepository);
      const userStatsRepository = queryRunner.manager.getCustomRepository(UserGameStatsRepository);

      const usersOnWinStreak = await userStatsRepository
        .createQueryBuilder('stat')
        .innerJoinAndMapOne('stat.user', 'stat.user', 'user')
        .where({winStreak: MoreThanOrEqual(3)})
        .getMany();


      const streakBadge = await badgeRepository
        .createQueryBuilder('badge')
        .where('id = :id', {id: BADGES.WIN_3_IN_ROW})
        .getOne();

      const streakBadges = usersOnWinStreak.map((e) =>
        queryRunner.query('INSERT into user_badges_badge ("badgeId", "userId") values ($1, $2)', [
          streakBadge.id,
          e.user.id,
        ])
      );

      const streakCoins = usersOnWinStreak.map((e) => {
        queryRunner.query('UPDATE user_stats SET coins = coins + $1 WHERE "userId" = $2', [
          streakBadge.awardingCoins,
          e.user.id
        ])
      })

      await Promise.all(streakBadges);
      await Promise.all(streakCoins);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" ALTER COLUMN "lastUsernameUpdateAt" DROP DEFAULT');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "win_streak"');
    }

}
