export interface IEditor {
    locked: boolean;
    text: string;
}

export interface IObjective {
    blueState: string;
    redState: string;
    description: string;
    isBonus: boolean;
}

export interface IPlayer {
    id: number;
    team: string;
    username: string;
    editorId: number;
}

export interface IGame {
    objectives: IObjective[];
    editors: { [id: string]: IEditor } ;
    players: IPlayer[];
}
