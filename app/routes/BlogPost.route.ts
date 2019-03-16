import * as express from 'express';
import {BlogPostController} from '../controllers/BlogPost.controller';

export const BlogPostRoute: express.Router = express.Router()
    .get('/posts', BlogPostController.all)
    .get('/post/:id', BlogPostController.show)
    .get('/post/slug/:slug', BlogPostController.bySlug);
