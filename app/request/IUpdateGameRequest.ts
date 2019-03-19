import { GameStatus } from '../models/Game';

export interface IUpdateGameRequest {
    status: GameStatus;

    startTime: number;

    name: string;
    season: number;
    theme: string;
    videoUrl: string;
}
