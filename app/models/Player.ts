// import { AfterInsert, AfterUpdate, BeforeRemove, Column, Entity, ManyToOne } from 'typeorm';

// import BaseModel from './BaseModel';
// import { User } from './User';

// @Entity('players')
// export class Player extends BaseModel {
//     /**
//      * Position assigned
//      */
//     @Column()
//     public language: string;

//     @ManyToOne((type) => GameTeam, (team: GameTeam) => team.players)
//     public team: GameTeam;

//     // TEMP (just so we can set the id manually for a given user)
//     @Column({ nullable: true })
//     public teamId: number;

//     @ManyToOne((type) => User, (user) => user.players, { eager: true })
//     public user: User;

//     // TEMP (just so we can set the id manually for a given user)
//     @Column({ nullable: true })
//     public userId: number;

//     @AfterInsert()
//     @AfterUpdate()
//     private async linkUserToGame() {
//         const game = await GameTeam.createQueryBuilder()
//             .relation(GameTeam, 'game')
//             .of(this.team)
//             .loadOne();
//         const user = await Player.createQueryBuilder()
//             .relation(Player, 'user')
//             .of(this)
//             .loadOne();

//         if (user && game) {
//             await User.createQueryBuilder()
//                 .relation(User, 'playedGames')
//                 .of(user)
//                 .add(game);
//         }
//     }

//     @BeforeRemove()
//     private async unlinkUserFromGame() {
//         const game = await GameTeam.createQueryBuilder()
//             .relation(GameTeam, 'game')
//             .of(this.team)
//             .loadOne();
//         const user = await Player.createQueryBuilder()
//             .relation(Player, 'user')
//             .of(this)
//             .loadOne();

//         if (user && game) {
//             await User.createQueryBuilder()
//                 .relation(User, 'playedGames')
//                 .of(user)
//                 .remove(game);
//         }
//     }
// }
