import { GameStatus } from '../models/GameSchedule';
import { IGameStorageObjective, IGameStorageTeam, IGameStorageMeta } from '../types/game';
import { GameMode } from '../models/Game';

export interface IUpdateGameRequest {
    // The updated status of the game..
    status: GameStatus;

    // any related meta information about hte game, typically containing all the
    // related results and scores of the finished game.
    meta?: IGameStorageMeta;

    // The objectives of the given game, what the teams must do to be win.
    objectives?: { [index: string]: IGameStorageObjective };

    // The teams objective, containing a list of the teams playing, including
    // the id of the team, name and which objectives have been completed.
    teams?: { [index: string]: IGameStorageTeam };

    // The title of the given game, this is the display name used when showing
    // users of the site players.
    title: string;

    // The mode the game is currently playing, e.g Classic, Blitz.
    mode: GameMode;

    // The updated video url of the game being played. e.g on twitch.
    videoUrl: string;
}
