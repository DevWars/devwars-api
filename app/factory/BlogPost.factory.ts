import {BlogPost} from "../models";
import { UserFactory } from "./User.factory";

export class BlogPostFactory {
    public static default(): BlogPost {
        const post = new BlogPost();

        Object.assign(post, {
            author: UserFactory.default(),
            content: "<p>Don't forget to tune in this weekend for the DevWars tournament!</p>",
            createdAt: new Date(),
            description: "The DevWars tournament starts this weekend!",
            imageUrl: "https://i.imgur.com/laaKm3C.png",
            slug: "the-devwars-tournament-approaches",
            title: "The DevWars Tournament Approaches",
            updatedAt: new Date(),
        });

        return post;
    }

    public static withSlug(slug: string): BlogPost {
        const post = this.default();

        post.slug = slug;

        return post;
    }
}
