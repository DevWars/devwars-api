import { GameStatus } from '../models/GameSchedule';

export interface IUpdateGameRequest {
    status: GameStatus;

    mode: string;
    objectives: object;
    teams: object;
    title: string;
    videoUrl: string;
}
