import { GameStatus } from '../models/GameSchedule';

export interface IUpdateGameRequest {
    status: GameStatus;
    meta: object;
    mode: string;
    objectives: object;
    teams: object;
    title: string;
    videoUrl: string;
}
