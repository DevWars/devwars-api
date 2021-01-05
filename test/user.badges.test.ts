import { EntityManager, getCustomRepository, getManager } from 'typeorm';
import * as supertest from 'supertest';
import { SuperTest, Test } from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';
import { nanoid } from 'nanoid';

import { BadgeSeeding, UserGameStatsSeeding, UserSeeding, UserStatsSeeding } from '../app/seeding';
import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';
import EmailVerification from '../app/models/emailVerification.model';
import User, { UserRole } from '../app/models/user.model';
import UserGameStats from '../app/models/userGameStats.model';
import UserStats from '../app/models/userStats.model';
import { cookieForUser } from './helpers';
import UserStatisticsRepository from '../app/repository/userStatistics.repository';
import { BadgeService } from '../app/services/badge.service';
import { BADGES } from '../app/constants';
import Badge from '../app/models/badge.model';

const server: ServerService = new ServerService();
let agent: SuperTest<Test>;

// used for the creation of the database transactions without the need of constantly calling into
// get manager everytime a test needs a transaction.
const connectionManager: EntityManager = getManager();

describe('user-badges', () => {
    let user: User;
    let userStats: UserStats;
    let userGameStats: UserGameStats;

    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);

        for (const badge of BadgeSeeding.default()) {
          await badge.save();
        }
    });

    beforeEach(async () => {
        agent = supertest.agent(server.App());

        user = UserSeeding.default();

        userGameStats = UserGameStatsSeeding.withUser(user);
        userGameStats.wins = 0;
        userGameStats.winStreak = 0;
        userGameStats.loses = 0;

        userStats = UserStatsSeeding.withUser(user);
        userStats.xp = 0;
        userStats.coins = 0;

        await connectionManager.transaction(async (transaction) => {
            await transaction.save(user);
            await transaction.save(userGameStats);
            await transaction.save(userStats);
        });
    });

    describe('GET - /users/:id/badges - Gather users badges', () => {
        it('should be a empty array if no badges have been earned.', async () => {
            const response = await agent
                .get(`/users/${user.id}/badges`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(0);
        });

        it('should contain verified email-address if earned', async () => {
            user.role = UserRole.PENDING;

            const emailVerification = new EmailVerification();
            emailVerification.token = nanoid(64);
            emailVerification.user = user;

            await emailVerification.save();
            await user.save();

            chai.expect(_.isNil(emailVerification)).to.be.equal(false, 'email verification must be defined.');

            await agent
                .get(`/auth/verify?token=${emailVerification.token}`)
                .set('cookie', await cookieForUser(user))
                .expect(302);

            const updatedUser = await User.findOne(user.id);
            chai.expect(updatedUser.role).to.be.equal(UserRole.USER);

            const response = await agent
                .get(`/users/${user.id}/badges`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);

            const [selectedBadge] = response.body.filter((e: Badge) => e.id === BADGES.EMAIL_VERIFICATION);
            chai.expect(selectedBadge.id).to.be.equal(BADGES.EMAIL_VERIFICATION);
        });

        it('should award 5000 dev coins badge when earned.', async () => {
            userStats.coins = 4999;
            await userStats.save();

            const userStatsRepository = getCustomRepository(UserStatisticsRepository);
            await userStatsRepository.updateCoinsForUser(user, 10);

            const response = await agent
                .get(`/users/${user.id}/badges`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(1);
            chai.expect(response.body[0].id).to.be.equal(BADGES.DEVWARS_COINS_5000);
        });

        it('should award 25000 dev coins badge when earned.', async () => {
            userStats.coins = 24999;
            await userStats.save();

            await BadgeService.awardBadgeToUserById(user, BADGES.DEVWARS_COINS_5000);

            const userStatsRepository = getCustomRepository(UserStatisticsRepository);
            await userStatsRepository.updateCoinsForUser(user, 10);

            const response = await agent
                .get(`/users/${user.id}/badges`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(2);

            const [selectedBadge] = response.body.filter((e: Badge) => e.id === BADGES.DEVWARS_COINS_25000);
            chai.expect(selectedBadge.id).to.be.equal(BADGES.DEVWARS_COINS_25000);
        });

        it("should award 25000 and 5000 dev coins badge when earned and don't already have them.", async () => {
            userStats.coins = 24999;
            await userStats.save();

            const userStatsRepository = getCustomRepository(UserStatisticsRepository);
            await userStatsRepository.updateCoinsForUser(user, 10);

            const response = await agent
                .get(`/users/${user.id}/badges`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(2);

            const [selectedBadgeOne] = response.body.filter((e: Badge) => e.id === BADGES.DEVWARS_COINS_25000);
            const [selectedBadgeTwo] = response.body.filter((e: Badge) => e.id === BADGES.DEVWARS_COINS_5000);

            chai.expect(selectedBadgeOne.id).to.be.equal(BADGES.DEVWARS_COINS_25000);
            chai.expect(selectedBadgeTwo.id).to.be.equal(BADGES.DEVWARS_COINS_5000);
        });

        it('should award first game win badge if first game and win', async () => {
            userGameStats.wins = 1;
            userGameStats.loses = 0;

            await userGameStats.save();

            await BadgeService.assignGameWinningBadgesForUsers([user]);

            const response = await agent
                .get(`/users/${user.id}/badges`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(1);

            const [selectedBadgeOne] = response.body.filter((e: Badge) => e.id === BADGES.WIN_FIRST_GAME);
            chai.expect(selectedBadgeOne.id).to.be.equal(BADGES.WIN_FIRST_GAME);
        });

        it('should award win 5 games badge on 5th win.', async () => {
            userGameStats.wins = 5;
            userGameStats.loses = 1;

            await userGameStats.save();

            await BadgeService.assignGameWinningBadgesForUsers([user]);

            const response = await agent
                .get(`/users/${user.id}/badges`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(1);

            const [selectedBadgeOne] = response.body.filter((e: Badge) => e.id === BADGES.WIN_5_GAMES);
            chai.expect(selectedBadgeOne.id).to.be.equal(BADGES.WIN_5_GAMES);
        });

        it('should award win 10 games badge on 10th win.', async () => {
            userGameStats.wins = 10;
            userGameStats.loses = 1;

            await userGameStats.save();

            await BadgeService.assignGameWinningBadgesForUsers([user]);

            const response = await agent
                .get(`/users/${user.id}/badges`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(1);

            const [selectedBadgeOne] = response.body.filter((e: Badge) => e.id === BADGES.WIN_10_GAMES);
            chai.expect(selectedBadgeOne.id).to.be.equal(BADGES.WIN_10_GAMES);
        });

        it('should award win 25 games badge on 25th win.', async () => {
            userGameStats.wins = 25;
            userGameStats.loses = 1;

            await userGameStats.save();

            await BadgeService.assignGameWinningBadgesForUsers([user]);

            const response = await agent
                .get(`/users/${user.id}/badges`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(1);

            const [selectedBadgeOne] = response.body.filter((e: Badge) => e.id === BADGES.WIN_25_GAMES);
            chai.expect(selectedBadgeOne.id).to.be.equal(BADGES.WIN_25_GAMES);
        });

        it('should award streak badge if met', async () => {
            userGameStats.winStreak = 3;
            userGameStats.loses = 1;
            userGameStats.wins = 3;

            userStats.coins = 0;

            await userGameStats.save();

            await BadgeService.assignGameWinningBadgesForUsers([user]);

            const response = await agent
                .get(`/users/${user.id}/badges`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(1);

            const [selectedBadgeOne] = response.body.filter((e: Badge) => e.id === BADGES.WIN_3_IN_ROW);
            chai.expect(selectedBadgeOne.id).to.be.equal(BADGES.WIN_3_IN_ROW);

            const userStatsRepository = getCustomRepository(UserStatisticsRepository);
            const stats = await userStatsRepository.findOne({ where: { user: user.id}})

            chai.expect(stats.coins).to.be.equal(selectedBadgeOne.awardingCoins);
        });
    });
});
