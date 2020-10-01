import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import BaseModel from './base.model';
import Game from './game.model';

@Entity('game_source')
export default class GameSource extends BaseModel {
    // The language of the source.
    @Column()
    public language: string;

    // The source text of the given game language.
    @Column()
    public source: string;

    // ------------------------------------------------------------
    // Relations
    // ------------------------------------------------------------

    @ManyToOne(() => Game)
    @JoinColumn()
    public game: Game;

    /**
     * .Creates a new instance of the Game Source model.
     *
     * @param language The language of the source.
     * @param source The raw source text.
     * @param game The game that owns the source
     */
    public constructor(language?: string, source?: string, game?: Game) {
        super();

        this.language = language;
        this.source = source;
        this.game = game;
    }
}
