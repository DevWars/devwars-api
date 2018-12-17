import {BlogPost} from "../models";

export class BlogPostRepository {

    public static all(): Promise<BlogPost[]> {
        return BlogPost.find({order: {createdAt: "DESC"}});
    }

    public static show(id: number): Promise<BlogPost> {
        return BlogPost.findOne(id);
    }

    public static bySlug(slug: string): Promise<BlogPost> {
        return BlogPost.findOne({where: {slug}});
    }
}
