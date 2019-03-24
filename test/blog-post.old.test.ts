import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {BlogPostFactory} from '../app/factory';
import {Server} from '../config/Server';

const server: Server = new Server();
let app: express.Application;

describe('post', () => {
    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it('should return all blog posts in descending order', async () => {
        await BlogPostFactory.default().save();

        const response = await supertest(app).get('/blog/posts').send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('array');
    });

    it('should return blog post from post id', async () => {
        const post = await BlogPostFactory.default().save();

        const response = await supertest(app).get(`/blog/post/${post.id}`).send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('object');
    });

    it('should return blog post from slug', async () => {
        const post = await BlogPostFactory.default().save();

        const response = await supertest(app).get(`/blog/post/slug/${post.slug}`).send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('object');
    });
});
