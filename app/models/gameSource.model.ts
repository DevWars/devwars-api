import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import BaseModel from './base.model';
import Game from './game.model';

@Entity('game_source')
export default class GameSource extends BaseModel {
    // The language of the source.
    @Column()
    public file: string;

    // The source text of the given game language.
    @Column()
    public source: string;

    // The allocated team the source came from.
    @Column()
    public team: number;

    // ------------------------------------------------------------
    // Relations
    // ------------------------------------------------------------

    @ManyToOne(() => Game)
    @JoinColumn()
    public game: Game;

    /**
     * .Creates a new instance of the Game Source model.
     *
     * @param team The team the source came from.
     * @param file The file and the extension tag, e.g game.js
     * @param source The raw source text.
     * @param game The game that owns the source
     */
    public constructor(team?: number, file?: string, source?: string, game?: Game) {
        super();

        this.team = team;
        this.file = file;
        this.source = source;
        this.game = game;
    }
}
