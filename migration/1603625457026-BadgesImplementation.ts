import { MigrationInterface, Not, QueryRunner, MoreThanOrEqual } from 'typeorm';
import * as _ from 'lodash';

import { BADGES } from '../app/constants';
import Badge from '../app/models/badge.model';
import User, { UserRole } from '../app/models/user.model';
import UserBadges from '../app/models/userBadges.model';
import LinkedAccountRepository from '../app/repository/linkedAccount.repository';
import UserRepository from '../app/repository/user.repository';
import UserStatisticsRepository from '../app/repository/userStatistics.repository';

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
                    badge_id    integer,
                    user_id     integer,
                    constraint "PK_715b81e610ab276ff6603cfc8e8"
                        primary key (id),
                    constraint "FK_5884bfd1713e03fdc9a5e77f709"
                        foreign key (badge_id) references public.badge,
                    constraint "FK_b575efa2c1fbf6ffa17fdd811a9"
                        foreign key (user_id) references public."user"
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
        const userRepository = queryRunner.connection.getCustomRepository(UserRepository);
        const verifiedUsers = await userRepository.find({ where: { role: Not(UserRole.PENDING)}})
        const verificationBadge = await Badge.findOne(BADGES.EMAIL_VERIFICATION);

        const verificationBadges = verifiedUsers.map(e => new UserBadges(e, verificationBadge).save());
        await Promise.all(verificationBadges);

        // award connecting any social media accounts.
        const linkedAccountRepository = queryRunner.connection.getCustomRepository(LinkedAccountRepository);
        const linkedUsers = _.uniqBy(await linkedAccountRepository.find({ relations: ['user'], }), e => e.user.id);
        const linkedBadge = await Badge.findOne(BADGES.SINGLE_SOCIAL_ACCOUNT);

        const linkedBadges = linkedUsers.map(e => new UserBadges(e.user, linkedBadge).save());
        await Promise.all(linkedBadges);

        // 5000 and 25000 badges
        const userStatsRepository = queryRunner.connection.getCustomRepository(UserStatisticsRepository);
        const usersWithCoins = await userStatsRepository.find({ where: { coins: MoreThanOrEqual(5000)}, relations: ['user']});

        const fiveBadge = await Badge.findOne(BADGES.DEVWARS_COINS_5000);
        const twentyBadge = await Badge.findOne(BADGES.DEVWARS_COINS_25000);

        const devCoinBadges: Promise<UserBadges>[] = [];

        usersWithCoins.forEach(e=> {
            if (e.coins >= 5000)  devCoinBadges.push(new UserBadges(e.user, fiveBadge).save());
            if (e.coins >= 25000)  devCoinBadges.push(new UserBadges(e.user, twentyBadge).save());
        })

        await Promise.all(devCoinBadges);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable('user_badges_badge', true, true, true);
        await queryRunner.dropTable('badge', true, true, true);
    }
}
