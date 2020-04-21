import * as chai from 'chai';
import * as _ from 'lodash';

import PaginationService from '../app/services/pagination.service';

describe('pagination service', () => {
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

        it('should return a empty cursor if the page is its first and does not have the additional value to page forward', () => {
            const body = [{ key: true }, { key: true }];
            // @ts-ignore
            const result = PaginationService.generateCursorFromResult(body, 2, 'key', true, true);

            chai.expect(result.next).of.be.equal(null);
            chai.expect(result.previous).of.be.equal(null);
        });

        it('should return a empty previous but valued next if the page is its first and does have the additional value to page forward', () => {
            const body = [{ key: 3 }, { key: 2 }, { key: 1 }];
            // @ts-ignore
            const result = PaginationService.generateCursorFromResult(body, 2, 'key', true, true);

            chai.expect(result.previous).of.be.equal(null);
            chai.expect(result.next).of.be.equal(Buffer.from(`next__${2}`).toString('base64'));
        });

        it('should return a empty next but valued previous if the page is its not first and does have the additional value to page backwards', () => {
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

    describe.skip('decodeCursorProperties', () => {
        it.only('Not implemented');
    });

    describe.skip('pageRepository', () => {
        it.only('Not implemented');
    });
});
