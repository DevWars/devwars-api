import { getManager, EntityManager, getCustomRepository } from 'typeorm';
import { hacker, helpers, random } from 'faker';
import * as supertest from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';

import { GameScheduleSeeding, UserSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';

import GameSchedule, { GameStatus } from '../app/models/GameSchedule';
import { UserRole } from '../app/models/User';
import GameScheduleRepository from '../app/repository/GameSchedule.repository';
import GameRepository from '../app/repository/Game.repository';

const server: ServerService = new ServerService();
let agent: any;

// Used for the creation of the database transactions without the need of constantly calling into
// get manager every time a test needs a transaction.
const connectionManager: EntityManager = getManager();

function generateSchedule() {
    const objectives = GameScheduleSeeding.createObjectives(random.number({ min: 3, max: 5 }));
    const toIdMap = (result: any, obj: { id: number }) => {
        result[obj.id] = obj;
        return result;
    };
    return {
        startTime: new Date(),
        mode: helpers.randomize(['Classic', 'Zen Garden', 'Blitz']),
        title: `${hacker.noun()} ${hacker.noun()}`,
        objectives: objectives.reduce(toIdMap, {}),
    };
}

describe('Game-Schedule', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    afterEach(async () => {
        const scheduleRepository = getCustomRepository(GameScheduleRepository);
        const gameRepository = getCustomRepository(GameRepository);

        await gameRepository.delete({});
        await scheduleRepository.delete({});
    });

    describe('GET - /schedules - Gathering all schedules', () => {
        it('Should retrieve all schedules', async () => {
            const scheduleOne = GameScheduleSeeding.default();
            const scheduleTwo = GameScheduleSeeding.default();

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(scheduleOne);
                await transaction.save(scheduleTwo);
            });

            const response = await agent.get('/schedules').send();
            chai.expect(response.body.length).to.be.equal(2);
        });
    });

    describe('GET - /schedules/latest - Gathering the latest game schedule', () => {
        it('Should return the last schedule created', async () => {
            const currentDate = new Date();
            const futureDate = new Date();

            futureDate.setHours(currentDate.getHours() + 2);

            const scheduleOne = GameScheduleSeeding.withTime(currentDate);
            const scheduleTwo = GameScheduleSeeding.withTime(futureDate);

            await connectionManager.transaction(async (transaction) => {
                transaction.save(scheduleTwo);
                transaction.save(scheduleOne);
            });

            const response = await agent
                .get('/schedules/latest')
                .send()
                .expect(200);

            chai.expect(response.body.id).to.be.eq(scheduleTwo.id);
        });
    });

    describe('GET - /schedules/:id - Gathering a single game schedule', () => {
        it('Should retrieve the schedule if specified', async () => {
            const schedule = await GameScheduleSeeding.default().save();

            const response = await agent.get(`/schedules/${schedule.id}`).expect(200);
            chai.expect(response.body.id).to.be.eq(schedule.id);
        });

        it('Should return 404 because no schedule is found', async () => {
            await agent
                .get('/schedules/3')
                .send()
                .expect(404);
        });
    });

    describe('POST - /schedules - Creating a new game schedule', () => {
        it('Should return 403 because user cant create a schedule.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            const Schedule = generateSchedule();

            await agent
                .post('/schedules')
                .set('Cookie', await cookieForUser(user))
                .send(Schedule)
                .expect(403);
        });

        it('Should return the schedule created because admin can create.', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            const Schedule = generateSchedule();

            const goodRequest = await agent
                .post('/schedules')
                .set('Cookie', await cookieForUser(user))
                .send(Schedule)
                .expect(200);

            const ScheduleCreated = await GameSchedule.findOne(goodRequest.body.id);

            chai.expect(!_.isNil(ScheduleCreated) && !_.isNil(ScheduleCreated.setup)).to.be.eq(true);
            chai.expect(ScheduleCreated.setup.title).to.be.eq(goodRequest.body.title);
        });

        it('should return the schedule created because moderator can create.', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const Schedule = generateSchedule();

            const goodRequest = await agent
                .post('/schedules')
                .set('Cookie', await cookieForUser(user))
                .send(Schedule)
                .expect(200);

            const ScheduleCreated = await GameSchedule.findOne(goodRequest.body.id);
            chai.expect(ScheduleCreated.setup.title).to.be.eq(goodRequest.body.title);
        });
    });

    describe('PATCH - /schedules/:id - updating a existing game schedule', () => {
        it('Should return 403 because user cant update a schedule', async () => {
            const Schedule = await GameScheduleSeeding.default().save();

            const user = await UserSeeding.withRole(UserRole.USER).save();
            const updateData = {
                title: 'helloWorld',
            };

            await agent
                .patch(`/schedules/${Schedule.id}`)
                .set('Cookie', await cookieForUser(user))
                .expect(403);
        });

        it('Should return the schedules update because mod', async () => {
            const Schedule = await GameScheduleSeeding.default().save();

            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const updateData = {
                title: 'helloWorld',
            };

            const request = await agent
                .patch(`/schedules/${Schedule.id}`)
                .set('Cookie', await cookieForUser(user))
                .send(updateData);

            const ScheduleUpdated = await GameSchedule.findOne(request.body.id);
            chai.expect(ScheduleUpdated.setup.title).to.be.eq(updateData.title);
        });

        it('Should return the schedules update because admin', async () => {
            const Schedule = await GameScheduleSeeding.default().save();

            const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            const updateData = {
                title: 'helloWorld',
            };

            const request = await agent
                .patch(`/schedules/${Schedule.id}`)
                .set('Cookie', await cookieForUser(user))
                .send(updateData);

            const ScheduleUpdated = await GameSchedule.findOne(request.body.id);
            chai.expect(ScheduleUpdated.setup.title).to.be.eq(updateData.title);
        });
    });

    describe('GET - /schedules/status/:status - Gathering schedules by status', () => {
        it('Should return a list a schedules by status', async () => {
            const gameStates = [GameStatus.ACTIVE, GameStatus.ACTIVE, GameStatus.ENDED, GameStatus.SCHEDULED];

            await connectionManager.transaction(async (transaction) => {
                for (const state of gameStates) {
                    const schedule = GameScheduleSeeding.withStatus(state);
                    await transaction.save(schedule);
                }
            });

            const request = await agent.get('/schedules/status/active').send();

            chai.expect(request.body).to.have.lengthOf(2);
        });
    });

    describe('POST - /schedules/:schedule/activate - Activating the schedule and creating the game', async () => {
        let user: any = null;
        let mod: any = null;
        let schedule: any = null;

        beforeEach(async () => {
            user = await UserSeeding.withRole(UserRole.USER).save();
            mod = await UserSeeding.withRole(UserRole.MODERATOR).save();
            schedule = await GameScheduleSeeding.withStatus(GameStatus.SCHEDULED).save();
        });

        it('should fail if not authenticated as a moderator or higher', async () => {
            await agent.post(`/schedules/${schedule.id}/activate`).expect(401);

            await agent
                .post(`/schedules/${schedule.id}/activate`)
                .set('Cookie', await cookieForUser(user))
                .expect(403);

            await agent
                .post(`/schedules/${schedule.id}/activate`)
                .set('Cookie', await cookieForUser(mod))
                .expect(200);
        });

        it('should fail if the given schedule does not exist.', async () => {
            await agent
                .post('/schedules/999/activate')
                .set('Cookie', await cookieForUser(mod))
                .expect(404, {
                    error: 'A game schedule does not exist for the given id.',
                });
        });

        it.skip('should fail if the schedule is not in a scheduled state', async () => {});
        it.skip('should fail if the schedule already has a related game.', async () => {});
        it.skip('should setup the relation between the game and the schedule', async () => {});
        it.skip('should setup the relation between the schedule and the game', async () => {});
    });
});
