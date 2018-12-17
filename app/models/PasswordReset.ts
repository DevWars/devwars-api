import { Column, Entity, ManyToOne } from "typeorm";
import BaseModel from "./BaseModel";
import { User } from "./User";

@Entity("password_resets")
export class PasswordReset extends BaseModel {
    @Column({default: ""})
    public token: string;

    @ManyToOne((type) => User, (user) => user.passwordResets)
    public user: User;
}
