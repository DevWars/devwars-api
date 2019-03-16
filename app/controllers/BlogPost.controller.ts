import { Request, Response } from 'express';

import { BlogPostRepository } from '../repository';

export class BlogPostController {
    public static async all(request: Request, response: Response) {
        const posts = await BlogPostRepository.all();

        response.json(posts);
    }

    public static async show(request: Request, response: Response) {
        const id = request.params.id;
        const post = await BlogPostRepository.show(id);

        response.json(post);
    }

    public static async bySlug(request: Request, response: Response) {
        const slug = request.params.slug;
        const post = await BlogPostRepository.bySlug(slug);

        response.json(post);
    }
}
