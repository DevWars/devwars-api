import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import { Server } from '../config/Server';

import { GameScheduleFactory, UserFactory } from '../app/factory';

import GameSchedule from '../app/models/GameSchedule';
import { UserRole } from '../app/models/User';
import { GameStatus } from '../app/models/GameSchedule';

import { hacker, helpers, random } from 'faker';
import { cookieForUser } from './helpers';
import './setup';

const server: Server = new Server();
let app: express.Application;

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
    beforeEach(async () => {
        await server.Start();
        app = server.App();
    });

    it('GET - /schedules/:id', async () => {
        const schedule = await GameScheduleFactory.default().save();

        const response = await supertest(app)
            .get(`/schedules/${schedule.id}`)
            .send();

        chai.expect(response.body.id).to.be.eq(schedule.id);
    });

    it('GET - /schedules', async () => {
        const schedule1 = await GameScheduleFactory.default().save();
        const schedul2 = await GameScheduleFactory.default().save();

        const response = await supertest(app)
            .get('/schedules')
            .send();

        chai.expect(response.body.length).to.be.equal(2);
    });

    it('GET - /schedules/latest', async () => {
        const schedule1 = await GameScheduleFactory.default().save();
        const schedule2 = await GameScheduleFactory.default().save();

        const response = await supertest(app)
            .get('/schedules/latest')
            .send();

        chai.expect(response.body.id).to.be.eq(schedule2.id);
    });

    it('POST - schedules/create - normal user', async () => {
        const Schedule = generateSchedule();
        const user = await UserFactory.withRole(UserRole.USER);

        const badRequest = await supertest(app)
            .post('/schedules')
            .set('Cookie', await cookieForUser(user))
            .send(Schedule);

        chai.expect(badRequest.status).to.be.eq(403);
    });

    it('POST - schedules/create - admin user', async () => {
        const Schedule = generateSchedule();
        const user = await UserFactory.withRole(UserRole.ADMIN);

        const goodRequest = await supertest(app)
            .post('/schedules')
            .set('Cookie', await cookieForUser(user))
            .send(Schedule);

        const ScheduleCreated = await GameSchedule.findOne(goodRequest.body.id);
        chai.expect(ScheduleCreated.setup.title).to.be.eq(goodRequest.body.title);
    });

    it('POST - schedules/create - admin user failed type check', async () => {
        let Schedule = generateSchedule();
        const user = await UserFactory.withRole(UserRole.ADMIN);
        // @ts-ignore
        Schedule.title = 2222;

        const request = await supertest(app)
            .post('/schedules')
            .set('Cookie', await cookieForUser(user))
            .send(Schedule);

        chai.expect(request.status).to.be.eq(422);
    });

    it('POST - schedules/create - admin user failed type check', async () => {
        let Schedule = generateSchedule();
        const user = await UserFactory.withRole(UserRole.ADMIN);
        // @ts-ignore
        Schedule.startTime = "kljlk";

        const request = await supertest(app)
            .post('/schedules')
            .set('Cookie', await cookieForUser(user))
            .send(Schedule);

        chai.expect(request.status).to.be.eq(500);
    });

    it('POST - schedules/create - admin user failed type check', async () => {
        let Schedule = generateSchedule();
        const user = await UserFactory.withRole(UserRole.ADMIN);
        // @ts-ignore
        Schedule.mode = 'fail mode';

        const request = await supertest(app)
            .post('/schedules')
            .set('Cookie', await cookieForUser(user))
            .send(Schedule);

        chai.expect(request.status).to.be.eq(422);
    });

    it('POST - schedules/create - admin user failed type check', async () => {
        let Schedule = generateSchedule();
        const user = await UserFactory.withRole(UserRole.ADMIN);
        // @ts-ignore
        Schedule.objectives = "undefined";

        const request = await supertest(app)
            .post('/schedules')
            .set('Cookie', await cookieForUser(user))
            .send(Schedule);

        chai.expect(request.status).to.be.eq(422);
    });

    it('POST - schedules/create - moderator user', async () => {
        const Schedule = generateSchedule();
        const user = await UserFactory.withRole(UserRole.MODERATOR);

        const goodRequest = await supertest(app)
            .post('/schedules')
            .set('Cookie', await cookieForUser(user))
            .send(Schedule);

        const ScheduleCreated = await GameSchedule.findOne(goodRequest.body.id);
        chai.expect(ScheduleCreated.setup.title).to.be.eq(goodRequest.body.title);
    });

    it('PATCH - schedules/:id - normal user', async () => {
        const Schedule = await GameScheduleFactory.default().save();
        const user = await UserFactory.withRole(UserRole.USER);
        const updateDatas = {
            title: 'helloWorld',
        };

        const request = await supertest(app)
            .patch(`/schedules/${Schedule.id}`)
            .set('Cookie', await cookieForUser(user))
            .send(updateDatas);

        chai.expect(request.status).to.be.eq(403);
    });

    it('PATCH - schedules/:id - moderator user', async () => {
        const Schedule = await GameScheduleFactory.default().save();
        const user = await UserFactory.withRole(UserRole.MODERATOR);
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

    it('PATCH - schedules/:id - admin user', async () => {
        const Schedule = await GameScheduleFactory.default().save();
        const user = await UserFactory.withRole(UserRole.MODERATOR);
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

    it('PATCH - schedules/:id - admin user fail type check', async () => {
        const Schedule = await GameScheduleFactory.default().save();
        const user = await UserFactory.withRole(UserRole.MODERATOR);
        const updateDatas = {
            title: 222,
        };

        const request = await supertest(app)
            .patch(`/schedules/${Schedule.id}`)
            .set('Cookie', await cookieForUser(user))
            .send(updateDatas);

        chai.expect(request.status).to.be.eq(422);
    });

    it('PATCH - schedules/:id - admin user fail type check', async () => {
        const Schedule = await GameScheduleFactory.default().save();
        const user = await UserFactory.withRole(UserRole.MODERATOR);
        const updateDatas = {
            startTime: "lakdjlkdjs",
        };

        const request = await supertest(app)
            .patch(`/schedules/${Schedule.id}`)
            .set('Cookie', await cookieForUser(user))
            .send(updateDatas);

        chai.expect(request.status).to.be.eq(500);
    });

    it('PATCH - schedules/:id - admin user fail type check', async () => {
        const Schedule = await GameScheduleFactory.default().save();
        const user = await UserFactory.withRole(UserRole.MODERATOR);
        const updateDatas = {
            // @ts-ignore
            objectives: "adadssd",
        };

        const request = await supertest(app)
            .patch(`/schedules/${Schedule.id}`)
            .set('Cookie', await cookieForUser(user))
            .send(updateDatas);

        chai.expect(request.status).to.be.eq(422);
    });

    it('GET - schedules/status/:status', async () => {
        const schedule1 = await GameScheduleFactory.withStatus(GameStatus.ACTIVE).save();
        const schedule2 = await GameScheduleFactory.withStatus(GameStatus.ACTIVE).save();
        const schedule3 = await GameScheduleFactory.withStatus(GameStatus.ENDED).save();
        const schedule4 = await GameScheduleFactory.withStatus(GameStatus.SCHEDULED).save();

        const request = await supertest(app)
            .get('/schedules/status/active')
            .send();

        chai.expect(request.body).to.have.lengthOf(2);
    });
});
