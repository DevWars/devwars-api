import * as chai from 'chai';
import * as _ from 'lodash';
import { getCustomRepository } from 'typeorm';

import PaginationService from '../app/services/pagination.service';
import { Connection } from '../app/services/Connection.service';

import UserRepository from '../app/repository/User.repository';
import { UserSeeding } from '../app/seeding';
import User from '../app/models/User';

describe('pagination service', () => {
    before(async () => {
        await (await Connection).synchronize(true);
    });

    describe('generateCursorFromResult', () => {
        it('should return a empty cursor if result is empty', async () => {
            // @ts-ignore
            const result = PaginationService.generateCursorFromResult([], 10, 'key', false, true);

            chai.expect(result.next).of.be.equal(null);
            chai.expect(result.previous).of.be.equal(null);
        });

        it('should throw if the first resulting key does not contain the pointer key', async () => {
            const body = [{ notKey: true }, { key: true }];

            chai.expect(() => {
                // @ts-ignore
                PaginationService.generateCursorFromResult(body, 10, 'key', false, true);
            }).to.throw('property must exist on the result object as pointerKey.');
        });

        it('should throw if the last resulting key does not contain the pointer key', async () => {
            const body = [{ key: true }, { notKey: true }];

            chai.expect(() => {
                // @ts-ignore
                PaginationService.generateCursorFromResult(body, 10, 'key', false, true);
            }).to.throw('property must exist on the result object as pointerKey.');
        });

        it('should return a empty cursor if first page and has no additional value to page forward', () => {
            const body = [{ key: true }, { key: true }];
            // @ts-ignore
            const result = PaginationService.generateCursorFromResult(body, 2, 'key', true, true);

            chai.expect(result.next).of.be.equal(null);
            chai.expect(result.previous).of.be.equal(null);
        });

        it('should return a empty previous but valued next if first page and has no additional value to page', () => {
            const body = [{ key: 3 }, { key: 2 }, { key: 1 }];
            // @ts-ignore
            const result = PaginationService.generateCursorFromResult(body, 2, 'key', true, true);

            chai.expect(result.previous).of.be.equal(null);
            chai.expect(result.next).of.be.equal(Buffer.from(`next__${2}`).toString('base64'));
        });

        it('should return a empty next but valued previous if not first and does have additional value to page', () => {
            const body = [{ key: 3 }, { key: 2 }, { key: 1 }];
            // @ts-ignore
            const result = PaginationService.generateCursorFromResult(body, 3, 'key', false, false);

            chai.expect(result.previous).of.be.equal(null);
            chai.expect(result.next).of.be.equal(Buffer.from(`next__${3}`).toString('base64'));
        });

        it('should return a non-empty next/previous if not first and limit + 1 are met for forward paging', () => {
            const body = [{ key: 3 }, { key: 2 }, { key: 1 }, { key: 5 }];
            // @ts-ignore
            const result = PaginationService.generateCursorFromResult(body, 3, 'key', false, true);

            chai.expect(result.next).of.be.equal(Buffer.from(`next__${1}`).toString('base64'));
            chai.expect(result.previous).of.be.equal(Buffer.from(`prev__${3}`).toString('base64'));
        });

        it('should return a non-empty next/previous if not first and limit + 1 are met for backwards paging', () => {
            const body = [{ key: 3 }, { key: 2 }, { key: 1 }, { key: 5 }];
            // @ts-ignore
            const result = PaginationService.generateCursorFromResult(body, 3, 'key', false, false);

            chai.expect(result.next).of.be.equal(Buffer.from(`next__${3}`).toString('base64'));
            chai.expect(result.previous).of.be.equal(Buffer.from(`prev__${1}`).toString('base64'));
        });

        it('should process dates if provided as iso values', () => {
            const body = [{ key: new Date() }, { key: new Date() }, { key: new Date() }, { key: new Date() }];
            // @ts-ignore
            const result = PaginationService.generateCursorFromResult(body, 3, 'key', false, false);

            const [{ key: a }, { key: b }] = body;

            chai.expect(result.next).of.be.equal(Buffer.from(`next__${a.toISOString()}`).toString('base64'));
            chai.expect(result.previous).of.be.equal(Buffer.from(`prev__${b.toISOString()}`).toString('base64'));

            const aDecoded = Buffer.from(result.next, 'base64').toString();
            chai.expect(aDecoded.split('__')[1]).to.be.equal(a.toISOString());

            const bDecoded = Buffer.from(result.previous, 'base64').toString();
            chai.expect(bDecoded.split('__')[1]).to.be.equal(b.toISOString());

            // @ts-ignore
            const aDecodedDirect = PaginationService.decodeCursorProperties(result.next, true);
            // @ts-ignore
            const bDecodedDirect = PaginationService.decodeCursorProperties(result.previous, true);

            chai.expect(aDecodedDirect).to.be.deep.equal(a);
            chai.expect(bDecodedDirect).to.be.deep.equal(b);
        });
    });

    describe('decodeCursorProperties', () => {
        it('should return null if the cursor is null or undefined', () => {
            // @ts-ignore
            let response = PaginationService.decodeCursorProperties(null);
            chai.expect(response).to.be.equal(null);

            // @ts-ignore
            response = PaginationService.decodeCursorProperties(undefined);
            chai.expect(response).to.be.equal(null);
        });

        it('should return null if the cursor is not a string', () => {
            for (const value of [[], {}, null, undefined, 5, NaN]) {
                // @ts-ignore
                const response = PaginationService.decodeCursorProperties(value);
                chai.expect(response).to.be.equal(null);
            }
        });

        it('should return null if the cursor does not contain the splitter', () => {
            for (const value of ['cat', 'dog', 'foo.bar', 'chicken']) {
                // @ts-ignore
                const response = PaginationService.decodeCursorProperties(value);
                chai.expect(response).to.be.equal(null);
            }
        });

        it('should return the cursor if its valid', () => {
            // @ts-ignore
            const cursor = PaginationService.generateCursorFromResult(
                [{ key: 'first' }, { key: 'second' }, { key: 'third' }],
                2,
                'key',
                false,
                true
            );

            chai.expect(_.isNil(cursor.next)).to.be.eq(false);
            chai.expect(_.isNil(cursor.previous)).to.be.equal(false);

            // @ts-ignore
            const next = PaginationService.decodeCursorProperties(cursor.next);
            // @ts-ignore
            const previous = PaginationService.decodeCursorProperties(cursor.previous);

            chai.expect(_.isNil(next)).to.be.equal(false);
            chai.expect(next).to.be.equal('second');

            chai.expect(_.isNil(previous)).to.be.equal(false);
            chai.expect(previous).to.be.equal('first');
        });
    });

    describe('pageRepository', () => {
        before(async () => {
            for (let i = 1; i <= 20; i++) {
                await UserSeeding.default().save();
            }
        });

        it('should page through as expected', async () => {
            const userRepository = getCustomRepository(UserRepository);
            const users = await userRepository.find();

            // first page
            const userAmount = 5;

            let result = await PaginationService.pageRepository<User>(
                userRepository,
                userAmount,
                null,
                null,
                'username',
                false
            );

            let total = result.data.length;
            const userIds = _.map(result.data, (user) => user.id);

            do {
                result = await PaginationService.pageRepository<User>(
                    userRepository,
                    userAmount,
                    result.pagination.next,
                    result.pagination.previous,
                    'username',
                    false
                );

                chai.expect(result.data.length <= userAmount).to.be.equal(true);
                total += result.data.length;

                for (const user of result.data) {
                    chai.expect(userIds).to.not.contain(user.id);
                    userIds.push(user.id);
                }
            } while (!_.isNil(result) && !_.isNil(result.pagination.next));

            chai.expect(total).to.be.equal(users.length);
        });
    });
});
