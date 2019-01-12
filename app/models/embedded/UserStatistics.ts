import {Column} from "typeorm";

export interface IRank {
    level: number;
    rankLevel: number;
    xpRequired: number;

    rank: string;
    levelName: string;
}

export const ALL_RANKS: IRank[] = [
    {levelName: "bronze", level: 1, rankLevel: 1, rank: "Bronze I", xpRequired: 0},
    {levelName: "bronze", level: 2, rankLevel: 2, rank: "Bronze II", xpRequired: 250},
    {levelName: "bronze", level: 3, rankLevel: 3, rank: "Bronze III", xpRequired: 450},
    {levelName: "bronze", level: 4, rankLevel: 4, rank: "Bronze IV", xpRequired: 750},
    {levelName: "bronze", level: 5, rankLevel: 5, rank: "Bronze V", xpRequired: 1200},
    {levelName: "silver", level: 6, rankLevel: 1, rank: "Silver I", xpRequired: 2150},
    {levelName: "silver", level: 7, rankLevel: 2, rank: "Silver II", xpRequired: 2750},
    {levelName: "silver", level: 8, rankLevel: 3, rank: "Silver III", xpRequired: 3450},
    {levelName: "silver", level: 9, rankLevel: 4, rank: "Silver IV", xpRequired: 4250},
    {levelName: "silver", level: 10, rankLevel: 5, rank: "Silver V", xpRequired: 5100},
    {levelName: "gold", level: 11, rankLevel: 1, rank: "Gold I", xpRequired: 7150},
    {levelName: "gold", level: 12, rankLevel: 2, rank: "Gold II", xpRequired: 8150},
    {levelName: "gold", level: 13, rankLevel: 3, rank: "Gold III", xpRequired: 9200},
    {levelName: "gold", level: 14, rankLevel: 4, rank: "Gold IV", xpRequired: 10300},
    {levelName: "gold", level: 15, rankLevel: 5, rank: "Gold V", xpRequired: 11350},
    {levelName: "platinum", level: 16, rankLevel: 1, rank: "Platinum I", xpRequired: 13550},
    {levelName: "platinum", level: 17, rankLevel: 2, rank: "Platinum II", xpRequired: 14500},
    {levelName: "platinum", level: 18, rankLevel: 3, rank: "Platinum III", xpRequired: 15350},
    {levelName: "platinum", level: 19, rankLevel: 4, rank: "Platinum IV", xpRequired: 16250},
    {levelName: "platinum", level: 20, rankLevel: 5, rank: "Platinum V", xpRequired: 17050},
    {levelName: "diamond", level: 21, rankLevel: 1, rank: "Diamond I", xpRequired: 18950},
    {levelName: "diamond", level: 22, rankLevel: 2, rank: "Diamond II", xpRequired: 19500},
    {levelName: "diamond", level: 23, rankLevel: 3, rank: "Diamond III", xpRequired: 20100},
    {levelName: "diamond", level: 24, rankLevel: 4, rank: "Diamond IV", xpRequired: 20500},
    {levelName: "diamond", level: 25, rankLevel: 5, rank: "Diamond V", xpRequired: 20900},
    {levelName: "elite", level: 26, rankLevel: 1, rank: "Elite", xpRequired: 21750},
];

export class UserStatistics {
    @Column({default: 0})
    public coins: number;

    @Column({default: 0})
    public xp: number;

    @Column({default: 0})
    public wins: number;

    @Column({default: 0})
    public losses: number;

    public rank?: IRank;
    public nextRank?: IRank;
}
