import { MigrationInterface, QueryRunner } from 'typeorm';
import * as _ from 'lodash';

import { BADGES } from '../app/constants';
import UserBadges from '../app/models/userBadges.model';
import LinkedAccountRepository from '../app/repository/linkedAccount.repository';
import UserRepository from '../app/repository/user.repository';
import UserStatisticsRepository from '../app/repository/userStatistics.repository';
import BadgeRepository from '../app/repository/badge.repository';
import GameRepository from '../app/repository/game.repository';
import { UserRole } from '../app/models/user.model';

export class BadgesImplementation1603625457026 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            create table if not exists badge
            (
                id                        serial                  not null,
                "updatedAt"               timestamp default now() not null,
                "createdAt"               timestamp default now() not null,
                badge_name                varchar                 not null,
                badge_description         varchar                 not null,
                badge_awarding_experience integer                 not null,
                badge_awarding_coins      integer                 not null,
                badge_variant             integer                 not null,
                constraint "PK_76b7011c864d4521a14a5196c49"
                    primary key (id)
            );`);

        await queryRunner.query(`
                create table if not exists user_badges_badge
                (
                    id          serial                  not null,
                    "updatedAt" timestamp default now() not null,
                    "createdAt" timestamp default now() not null,
                    "badgeId"    integer,
                    "userId"     integer,
                    constraint "PK_715b81e610ab276ff6603cfc8e8"
                        primary key (id),
                    constraint "FK_5884bfd1713e03fdc9a5e77f709"
                        foreign key ("badgeId") references public.badge,
                    constraint "FK_b575efa2c1fbf6ffa17fdd811a9"
                        foreign key ("userId") references public."user"
                );`);

        await queryRunner.query(`
            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (1, 'Authentic', 'Verify your e-mail address', 0, 500, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (2, 'Making Links', 'Connect any one social media account to your profile', 0, 900, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (3, 'Full Coverage', 'Connect all possible social media accounts to your profile', 0, 1300, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (4, 'Feed The Pig', 'Save up 5000 Devcoins', 0, 0, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (5, 'Penny-Pincher', 'Save up 25000 Devcoins', 0, 0, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (6, 'High Roller', 'Earn 10000 Devcoins from betting', 0, 0, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (7, 'Innovator', 'Submit an idea that gets implemented', 0, 2100, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (8, 'Exterminator', 'Find a bug and report it to the DevWars team', 0, 1700, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (9, 'Follow Me', 'Refer 5 friends using your custom referral link', 0, 1300, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (10, 'Influential', 'Refer 25 friends using your custom referral link', 0, 2100, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (11, 'Natural Leader', 'Refer 50 friends using your custom referral link', 0, 4100, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (12, 'Ace High', 'Complete all objectives in a single game of DevWars', 0, 2100, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (13, 'First Timer', 'Watch your first game of DevWars', 0, 500, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (14, 'Hobbyist', 'Watch 5 games of DevWars', 0, 900, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (15, 'Biggest Fan', 'Watch 25 games of DevWars', 0, 1300, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (16, 'Obsessed', 'Watch 50 games of DevWars', 0, 2100, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (17, 'Beginner''s Luck', 'Win your first game of DevWars', 0, 2900, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (18, 'Victorious', 'Win 5 games of DevWars', 0, 900, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (19, 'Hotshot', 'Win 10 games of DevWars', 0, 2100, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (20, 'Steamroller', 'Win 25 games of DevWars', 0, 4900, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (21, 'Hot Streak', 'Win 3 games of DevWars in a row', 0, 1300, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (22, 'On The Ball', 'Answer first on a Twitch quiz question', 0, 900, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (23, 'Smarty Pants', 'Answer 10 Twitch quiz questions first', 0, 1300, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (24, 'I''m All In', 'Bet ALL of your Devcoins in a stream and win', 0, 900, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (25, 'Cake Day', 'Visit DevWars on your birthday', 0, 2100, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (26, 'Poll position', 'Complete a poll or a survey', 0, 900, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (27, 'Rapid Response', 'Complete 25 polls or surveys', 0, 3300, 0);

            INSERT INTO public.badge 
                (id, badge_name, badge_description, badge_awarding_experience, badge_awarding_coins, badge_variant) 
                VALUES (28, 'Coin Hoarder', 'Buy this badge from the coinshop to unlock it', 0, 0, 0);`);

        // award all users who have verified there email address.
        const linkedAccountRepository = queryRunner.manager.getCustomRepository(LinkedAccountRepository);
        const userRepository = queryRunner.manager.getCustomRepository(UserRepository);
        const badgeRepository = queryRunner.manager.getCustomRepository(BadgeRepository);
        const gameRepository = queryRunner.manager.getCustomRepository(GameRepository);
        const userStatsRepository = queryRunner.manager.getCustomRepository(UserStatisticsRepository);

        const verifiedUsers = await userRepository
            .createQueryBuilder('user')
            .where('role != :role')
            .setParameters({ role: UserRole.PENDING })
            .getMany();

        const verificationBadge = await badgeRepository
            .createQueryBuilder('badge')
            .where('id = :id', { id: BADGES.EMAIL_VERIFICATION })
            .getOne();

        const verificationBadges = verifiedUsers.map((e) =>
            queryRunner.query('INSERT into user_badges_badge ("badgeId", "userId") values ($1, $2)', [
                verificationBadge.id,
                e.id,
            ])
        );

        await Promise.all(verificationBadges);

        // award connecting any social media accounts.

        const linkedAccounts = await linkedAccountRepository
            .createQueryBuilder('linked_account')
            .innerJoinAndMapOne('linked_account.user', 'linked_account.user', 'user')
            .getMany();

        const linkedUsers = _.uniq(linkedAccounts.map((e) => e.user.id));

        const linkedBadge = await badgeRepository
            .createQueryBuilder('badge')
            .where('id = :id', { id: BADGES.SINGLE_SOCIAL_ACCOUNT })
            .getOne();

        const linkedBadges = linkedUsers.map((e) =>
            queryRunner.query('INSERT into user_badges_badge ("badgeId", "userId") values ($1, $2)', [
                linkedBadge.id,
                e,
            ])
        );

        await Promise.all(linkedBadges);

        // update teh given users coins for all linked accounts
        for (const link of linkedAccounts) {
            if (_.isNil(link.storage?.coins)) continue;

            const coins = link.storage.coins;

            await linkedAccountRepository
                .createQueryBuilder('linked_account')
                .update()
                .set({ storage: {} })
                .where('id = :id', { id: link.id })
                .execute();

            await userStatsRepository
                .createQueryBuilder('stat')
                .update()
                .set({ coins: () => `coins + ${coins}` })
                .where('"userId" = :id', { id: link.user.id })
                .execute();

            console.log({ link: JSON.stringify(link), storage: link.storage });
        }

        // // 5000 and 25000 badges
        const usersWithCoins = await userStatsRepository
            .createQueryBuilder('stat')
            .innerJoinAndMapOne('stat.user', 'stat.user', 'user')
            .leftJoinAndMapMany('user.connections', 'user.connections', 'linked_account')
            .getMany();

        const fiveBadge = await badgeRepository
            .createQueryBuilder('badge')
            .where('id = :id', { id: BADGES.DEVWARS_COINS_5000 })
            .getOne();

        const twentyBadge = await badgeRepository
            .createQueryBuilder('badge')
            .where('id = :id', { id: BADGES.DEVWARS_COINS_25000 })
            .getOne();

        const devCoinBadges: Promise<UserBadges>[] = [];

        usersWithCoins.forEach((e) => {
            let coins = e.coins;

            if (!_.isNil(e.user?.connections)) {
                coins += _.sum(e.user.connections.map((e) => e.storage?.coins || 0));
            }

            if (coins >= 5000)
                devCoinBadges.push(
                    queryRunner.query('INSERT into user_badges_badge ("badgeId", "userId") values ($1, $2)', [
                        fiveBadge.id,
                        e.user.id,
                    ])
                );
            if (coins >= 25000)
                devCoinBadges.push(
                    queryRunner.query('INSERT into user_badges_badge ("badgeId", "userId") values ($1, $2)', [
                        twentyBadge.id,
                        e.user.id,
                    ])
                );
        });

        await Promise.all(devCoinBadges);

        // win related badges.
        // this is going to work by gathering all games and all users assigned to said games. determine the winner
        // and increase the cache total wins for that user. If wins is 1 and loses 0, award first win badge, otherwise
        // award badges on 5, 10, 20, etc.
        // It has to be done this way to ensure first win badges are distributed.
        const winRelatedStats: { [index: string]: { first: boolean; wins: number; loses: number; user: number } } = {};

        const games = await gameRepository
            .createQueryBuilder('game')
            .innerJoinAndMapMany('game.applications', 'game.applications', 'game_application')
            .orderBy('game.createdAt', 'ASC')
            .getMany();

        for (const game of games) {
            if (game?.storage?.meta?.tie || _.isNil(game?.storage?.meta?.teamScores[0]?.objectives)) continue;

            const teamScores = game.storage.meta.teamScores;
            const check = (val: string) => (val === 'complete' ? 1 : 0);

            const teamOne = Object.values(teamScores[0].objectives).reduce((acc, val) => (acc += check(val)), 0);
            const teamTwo = Object.values(teamScores[1].objectives).reduce((acc, val) => (acc += check(val)), 0);

            const winningTeamIndex = teamOne > teamTwo ? 0 : 1;
            const losingTeamIndex = teamOne < teamTwo ? 0 : 1;

            for (const winner of game.applications.filter((e) => e.team === winningTeamIndex)) {
                if (_.isNil(winRelatedStats[winner.userId])) {
                    winRelatedStats[winner.userId] = { first: true, wins: 0, loses: 0, user: winner.userId };
                }

                winRelatedStats[winner.userId].wins += 1;
            }

            for (const loser of game.applications.filter((e) => e.team === losingTeamIndex)) {
                if (_.isNil(winRelatedStats[loser.userId])) {
                    winRelatedStats[loser.userId] = { first: false, wins: 0, loses: 0, user: loser.userId };
                }

                winRelatedStats[loser.userId].loses += 1;
            }
        }

        const winRelatedBadgePromises = [];

        const winBadges = [
            await badgeRepository.createQueryBuilder('badge').where('id = :id', { id: BADGES.WIN_FIRST_GAME }).getOne(),
            await badgeRepository.createQueryBuilder('badge').where('id = :id', { id: BADGES.WIN_5_GAMES }).getOne(),
            await badgeRepository.createQueryBuilder('badge').where('id = :id', { id: BADGES.WIN_10_GAMES }).getOne(),
            await badgeRepository.createQueryBuilder('badge').where('id = :id', { id: BADGES.WIN_25_GAMES }).getOne(),
        ];

        for (const winUser of Object.values(winRelatedStats)) {
            if (winUser.first) {
                winRelatedBadgePromises.push(
                    queryRunner.query('INSERT into user_badges_badge ("badgeId", "userId") values ($1, $2)', [
                        winBadges[0].id,
                        winUser.user,
                    ])
                );
            }

            if (winUser.wins >= 5) {
                winRelatedBadgePromises.push(
                    queryRunner.query('INSERT into user_badges_badge ("badgeId", "userId") values ($1, $2)', [
                        winBadges[1].id,
                        winUser.user,
                    ])
                );
            }

            if (winUser.wins >= 10) {
                winRelatedBadgePromises.push(
                    queryRunner.query('INSERT into user_badges_badge ("badgeId", "userId") values ($1, $2)', [
                        winBadges[2].id,
                        winUser.user,
                    ])
                );
            }

            if (winUser.wins >= 25) {
                winRelatedBadgePromises.push(
                    queryRunner.query('INSERT into user_badges_badge ("badgeId", "userId") values ($1, $2)', [
                        winBadges[3].id,
                        winUser.user,
                    ])
                );
            }
        }

        await Promise.all(winRelatedBadgePromises);

        // coin updates
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable('user_badges_badge', true, true, true);
        await queryRunner.dropTable('badge', true, true, true);
    }
}
