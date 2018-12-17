import { Column, Entity, ManyToOne } from "typeorm";

import BaseModel from "./BaseModel";
import {Game} from "./Game";

@Entity("language_templates")
export class LanguageTemplate extends BaseModel {

    @ManyToOne((type) => Game, (game: Game) => game.languageTemplates)
    public game: Game;

    @Column()
    public language: string;

    @Column()
    public content: string;

    // TEMP (just so we can set the id manually for a given user)
    @Column({nullable: true})
    public gameId: number;
}
