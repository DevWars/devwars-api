import { Column, Entity, ManyToOne } from "typeorm";
import BaseModel from "./BaseModel";
import { User } from "./User";

@Entity("blog_posts")
export class BlogPost extends BaseModel {
    /**
     * Display title
     */
    @Column({nullable: true})
    public title: string;

    /**
     * Short description of the blog post
     */
    @Column()
    public description: string;

    /**
     * Direct image link for banner
     */
    @Column()
    public imageUrl: string;

    /**
     * Raw HTML content
     */
    @Column({type: "text"})
    public content: string;

    /**
     * User friendly URL route for post
     */
    @Column()
    public slug: string;

    /**
     * User who wrote the post
     */
    @ManyToOne((type) => User, (user) => user.blogPosts)
    public author: User;

    // TEMP (just so we can set the id manually for a given user)
    @Column({nullable: true})
    public authorId: number;
}
