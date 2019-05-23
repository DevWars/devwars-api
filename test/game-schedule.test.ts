import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import { getManager, EntityManager } from 'typeorm';
import { hacker, helpers, random } from 'faker';

import { GameScheduleFactory, UserFactory } from '../app/factory';
import { Server } from '../config/Server';
import { cookieForUser } from './helpers';

import GameSchedule, { GameStatus } from '../app/models/GameSchedule';
import { UserRole } from '../app/models/User';

import './setup';

const server: Server = new Server();
let app: express.Application;

// used for the creation of the database transactions without the need of constantly calling into
// get manager everytime a test needs a transaction.
const connectionManager: EntityManager = getManager();

function generateSchedule() {
    const objectives = GameScheduleFactory.createObjectives(random.number({ min: 3, max: 5 }));
    const toIdMap = (result: any, obj: { id: number }) => {
        result[obj.id] = obj;
        return result;
    };
    return {
        startTime: new Date(),
        mode: helpers.randomize(['Classic', 'Zen Garden', 'Blitz']),
        title: hacker.noun(),
        objectives: objectives.reduce(toIdMap, {}),
    };
}

describe('game-schedule', () => {
    before(async () => {
        await server.Start();
        app = server.App();
    });

    it('GET - /schedules/:id - should retrieve the schedule', async () => {
        const schedule = await GameScheduleFactory.default().save();

        const response = await supertest(app)
            .get(`/schedules/${schedule.id}`)
            .send();

        chai.expect(response.body.id).to.be.eq(schedule.id);
    });

    it('GET - /schedules/:id - should return 404 because no schedule found', async () => {
        const response = await supertest(app)
            .get('/schedules/3')
            .send();

        chai.expect(response.status).to.be.eq(404);
    });

    it('GET - /schedules - should retrieve all schedules', async () => {
        const scheduleOne = GameScheduleFactory.default();
        const scheduleTwo = GameScheduleFactory.default();

        await connectionManager.transaction(async (transaction) => {
            await transaction.save(scheduleOne);
            await transaction.save(scheduleTwo);
        });

        const response = await supertest(app)
            .get('/schedules')
            .send();

        chai.expect(response.body.length).to.be.equal(2);
    });

    it('GET - /schedules/latest - should return the last schedule created', async () => {
        const currentDate = new Date();
        const futureDate = new Date();

        futureDate.setHours(currentDate.getHours() + 2);

        const scheduleOne = GameScheduleFactory.withTime(currentDate);
        const scheduleTwo = GameScheduleFactory.withTime(futureDate);

        await connectionManager.transaction(async (transaction) => {
            transaction.save(scheduleTwo);
            transaction.save(scheduleOne);
        });

        const response = await supertest(app)
            .get('/schedules/latest')
            .send();

        chai.expect(response.body.id).to.be.eq(scheduleTwo.id);
    });

    it('POST - schedules/create - should return 403 because user cant create a schedule', async () => {
        const user = UserFactory.withRole(UserRole.USER);
        const Schedule = generateSchedule();

        const badRequest = await supertest(app)
            .post('/schedules')
            .set('Cookie', await cookieForUser(user))
            .send(Schedule);

        chai.expect(badRequest.status).to.be.eq(403);
    });

    it('POST - schedules/create - should return the schedule created because admin can', async () => {
        const user = UserFactory.withRole(UserRole.ADMIN);
        const Schedule = generateSchedule();

        const goodRequest = await supertest(app)
            .post('/schedules')
            .set('Cookie', await cookieForUser(user))
            .send(Schedule);

        const ScheduleCreated = await GameSchedule.findOne(goodRequest.body.id);
        chai.expect(ScheduleCreated.setup.title).to.be.eq(goodRequest.body.title);
    });

    it('POST - schedules/create - should return the schedule created because mod can', async () => {
        const user = UserFactory.withRole(UserRole.MODERATOR);
        const Schedule = generateSchedule();

        const goodRequest = await supertest(app)
            .post('/schedules')
            .set('Cookie', await cookieForUser(user))
            .send(Schedule);

        const ScheduleCreated = await GameSchedule.findOne(goodRequest.body.id);
        chai.expect(ScheduleCreated.setup.title).to.be.eq(goodRequest.body.title);
    });

    // it('POST - schedules/create - should return 422 because title should be a string', async () => {
    //     let Schedule = generateSchedule();
    //     const user = await UserFactory.withRole(UserRole.ADMIN);
    //     // @ts-ignore
    //     Schedule.title = 2222;

    //     const request = await supertest(app)
    //         .post('/schedules')
    //         .set('Cookie', await cookieForUser(user))
    //         .send(Schedule);

    //     chai.expect(request.status).to.be.eq(422);
    // });

    // it('POST - schedules/create - should return 500 because of date analyze fail here', async () => {
    //     let Schedule = generateSchedule();
    //     const user = await UserFactory.withRole(UserRole.ADMIN);
    //     // @ts-ignore
    //     Schedule.startTime = "kljlk";

    //     const request = await supertest(app)
    //         .post('/schedules')
    //         .set('Cookie', await cookieForUser(user))
    //         .send(Schedule);

    //     chai.expect(request.status).to.be.eq(500);
    // });

    // it('POST - schedules/create -  should return 422 because mode should be in a special range if not', async () => {
    //     let Schedule = generateSchedule();
    //     const user = await UserFactory.withRole(UserRole.ADMIN);
    //     // @ts-ignore
    //     Schedule.mode = 'fail mode';

    //     const request = await supertest(app)
    //         .post('/schedules')
    //         .set('Cookie', await cookieForUser(user))
    //         .send(Schedule);

    //     chai.expect(request.status).to.be.eq(422);
    // });

    // it('POST - schedules/create -  should return 422 because objectives should be an object of objects', async () => {
    //     let Schedule = generateSchedule();
    //     const user = await UserFactory.withRole(UserRole.ADMIN);
    //     // @ts-ignore
    //     Schedule.objectives = "undefined";

    //     const request = await supertest(app)
    //         .post('/schedules')
    //         .set('Cookie', await cookieForUser(user))
    //         .send(Schedule);

    //     chai.expect(request.status).to.be.eq(422);
    // });

    it('PATCH - schedules/:id - should return 403 because user cant update a schedule', async () => {
        const Schedule = await GameScheduleFactory.default().save();

        const user = UserFactory.withRole(UserRole.USER);
        const updateDatas = {
            title: 'helloWorld',
        };

        const request = await supertest(app)
            .patch(`/schedules/${Schedule.id}`)
            .set('Cookie', await cookieForUser(user))
            .send(updateDatas);

        chai.expect(request.status).to.be.eq(403);
    });

    it('PATCH - schedules/:id - should return the schedules update because mod', async () => {
        const Schedule = await GameScheduleFactory.default().save();

        const user = UserFactory.withRole(UserRole.MODERATOR);
        const updateDatas = {
            title: 'helloWorld',
        };

        const request = await supertest(app)
            .patch(`/schedules/${Schedule.id}`)
            .set('Cookie', await cookieForUser(user))
            .send(updateDatas);

        const ScheduleUpdated = await GameSchedule.findOne(request.body.id);
        chai.expect(ScheduleUpdated.setup.title).to.be.eq(updateDatas.title);
    });

    it('PATCH - schedules/:id - should return the schedules update because admin', async () => {
        const Schedule = await GameScheduleFactory.default().save();

        const user = UserFactory.withRole(UserRole.ADMIN);
        const updateDatas = {
            title: 'helloWorld',
        };

        const request = await supertest(app)
            .patch(`/schedules/${Schedule.id}`)
            .set('Cookie', await cookieForUser(user))
            .send(updateDatas);

        const ScheduleUpdated = await GameSchedule.findOne(request.body.id);
        chai.expect(ScheduleUpdated.setup.title).to.be.eq(updateDatas.title);
    });

    // it('PATCH - schedules/:id - should return 422 because title should be string', async () => {
    //     const Schedule = await GameScheduleFactory.default().save();
    //     const user = await UserFactory.withRole(UserRole.MODERATOR);
    //     const updateDatas = {
    //         title: 222,
    //     };

    //     const request = await supertest(app)
    //         .patch(`/schedules/${Schedule.id}`)
    //         .set('Cookie', await cookieForUser(user))
    //         .send(updateDatas);

    //     chai.expect(request.status).to.be.eq(422);
    // });

    // it('PATCH - schedules/:id - should return 500 because date analyze', async () => {
    //     const Schedule = await GameScheduleFactory.default().save();
    //     const user = await UserFactory.withRole(UserRole.MODERATOR);
    //     const updateDatas = {
    //         startTime: "lakdjlkdjs",
    //     };

    //     const request = await supertest(app)
    //         .patch(`/schedules/${Schedule.id}`)
    //         .set('Cookie', await cookieForUser(user))
    //         .send(updateDatas);

    //     chai.expect(request.status).to.be.eq(500);
    // });

    // it('PATCH - schedules/:id - should return 422 because objectives should be an objects of objects', async () => {
    //     const Schedule = await GameScheduleFactory.default().save();
    //     const user = await UserFactory.withRole(UserRole.MODERATOR);
    //     const updateDatas = {
    //         // @ts-ignore
    //         objectives: "adadssd",
    //     };

    //     const request = await supertest(app)
    //         .patch(`/schedules/${Schedule.id}`)
    //         .set('Cookie', await cookieForUser(user))
    //         .send(updateDatas);

    //     chai.expect(request.status).to.be.eq(422);
    // });

    it('GET - schedules/status/:status - should return a list a schedules by status', async () => {
        const gameStates = [GameStatus.ACTIVE, GameStatus.ACTIVE, GameStatus.ENDED, GameStatus.SCHEDULED];

        await connectionManager.transaction(async (transaction) => {
            for (const state of gameStates) {
                const schedule = GameScheduleFactory.withStatus(state);
                await transaction.save(schedule);
            }
        });

        const request = await supertest(app)
            .get('/schedules/status/active')
            .send();

        chai.expect(request.body).to.have.lengthOf(2);
    });
});
