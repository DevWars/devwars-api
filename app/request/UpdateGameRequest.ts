import { GameStatus, GameMode } from '../models/game.model';
import { GameStorageMeta } from '../types/game';
import { GameObjective } from '../types/common';

export interface UpdateGameRequest {
    // The updated start time.
    startTime: Date;

    // The updated status of the game..
    status: GameStatus;

    // any related meta information about hte game, typically containing all the
    // related results and scores of the finished game.
    meta?: GameStorageMeta;

    // The objectives of the given game, what the teams must do to be win.
    objectives?: { [index: string]: GameObjective };

    // The title of the given game, this is the display name used when showing
    // users of the site players.
    title: string;

    // The mode the game is currently playing, e.g Classic, Blitz.
    mode: GameMode;

    // The updated video url of the game being played. e.g on twitch.
    videoUrl: string;
}
