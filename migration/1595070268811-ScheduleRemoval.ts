import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
import * as _ from 'lodash';
import UserRepository from '../app/repository/user.repository';
import User, { UserRole } from '../app/models/user.model';
import { randomString } from '../app/utils/random';
import GameApplication from '../app/models/gameApplication.model';
import GameApplicationRepository from '../app/repository/gameApplication.repository';
import Game from '../app/models/game.model';

export class ScheduleRemoval1595070268811 implements MigrationInterface {
    /**
     *
     * @param player The details of the user
     * @returns the id of the user or created missing user.
     */
    public async createOrLocateUserByDetails(
        queryRunner: QueryRunner,
        player: { id: number; username: string }
    ): Promise<number> {
        const userRepository = queryRunner.manager.getCustomRepository(UserRepository);

        let locatedUser = await userRepository
            .createQueryBuilder('user')
            .where('id = :userId')
            .setParameters({ userId: player.id })
            .getOne();

        if (!_.isNil(locatedUser)) return locatedUser.id;

        if (_.isNil(player.username) || player.username.trim().length <= 0) return null;

        locatedUser = await userRepository
            .createQueryBuilder('user')
            .where('Lower(username) = Lower(:username)')
            .setParameters({ username: player.username })
            .getOne();

        if (!_.isNil(locatedUser)) return locatedUser.id;

        const user = new User(
            player.username.toLowerCase(),
            randomString(32),
            `${player.username}@example.com`,
            UserRole.USER
        );
        user.lastSignIn = new Date();

        const createdUser = await userRepository.save(user);

        return createdUser.id;
    }

    public async up(queryRunner: QueryRunner): Promise<any> {
        // Step 1. Extend the game_application to contain the team, assignedLanguages and gameId.
        await queryRunner.addColumns('game_application', [
            new TableColumn({
                name: 'team',
                default: null,
                type: 'int',
                isNullable: true,
            }),
            new TableColumn({
                name: 'assignedLanguages',
                default: null,
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: 'gameId',
                // this will be updated to be not nullable after the games have been updated.
                isNullable: true,
                type: 'int',
            }),
        ]);

        await queryRunner.createForeignKey(
            'game_application',
            new TableForeignKey({
                name: 'game_application_gameId_fk',
                columnNames: ['gameId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'game',
            })
        );

        // step 2. Update the gameId field to be the game id directly from the schedule.
        await queryRunner.query(
            `update game_application set "gameId" = game_schedule."gameId"
            from game_schedule where game_schedule.id = game_application."scheduleId";`
        );

        const missingSchedule = await queryRunner.query(`
            select  gs.id as schedule, game.id as game from game
            INNER JOIN game_schedule gs on game.id = gs."gameId"
            where game."scheduleId" is NULL and gs."gameId" is not NULL;
        `);

        for (const mGame of missingSchedule) {
            await queryRunner.query('update game set "scheduleId" = $1 where id = $2', [mGame.schedule, mGame.game]);
        }

        const missingScheduleGames = await queryRunner.query('select * from game where "scheduleId" is NULL');

        for (const mGame of missingScheduleGames) {
            const [
                { id },
            ] = await queryRunner.query(
                'insert into game_schedule ("startTime", setup, "gameId", status) values ($1, $2, $3, $4) returning id',
                [new Date(), {}, mGame.id, 2]
            );

            await queryRunner.query('update game set "scheduleId" = $1 where id = $2', [id, mGame.id]);
        }

        // Mark the gameId as no longer null
        await queryRunner.query('delete from game_application where "gameId" is null;');
        await queryRunner.query('alter table game_application alter column "gameId" set not null;');

        // Remove the references from the schedule Id.
        await queryRunner.query('alter table game_application drop column "scheduleId";');
        await queryRunner.query('alter table game drop column "scheduleId";');

        // step 3. drop the schedule table since its no longer required, the game meta data
        // contains all the required information to update the game_application columns for
        // the given users.
        await queryRunner.dropTable('game_schedule', true, true, true);

        // Step 4. Update the game table to contain the start date time (this will be pulled from the metadata).
        await queryRunner.addColumn(
            'game',
            new TableColumn({
                name: 'startTime',
                type: 'timestamp',
                // This will be altered when all the game start tims are pulled from the metadata
                isNullable: true,
            })
        );

        // step 5. For every single game, ensure to load up the metadata, and assign all game applications for that
        // game for that user with the users assigned team, and assigned languages.
        const games = await queryRunner.query('select * from game;');

        for (const game of games) {
            const startTime = game.storage.startTime;

            // update the start time of the game.
            await queryRunner.query('update game set "startTime" = $1 where game.id = $2;', [startTime, game.id]);

            const players: any = {};

            const { objectives, templates } = game.storage;

            for (const editorIndex in game.storage.editors) {
                const editor = game.storage.editors[editorIndex];
                const playerData = game.storage.players[editor.player];

                if (_.isNil(players[editor.player]))
                    players[editor.player] = { team: editor.team, id: editor.player, languages: [] };

                if (playerData.username != null) players[editor.player].username = playerData.username;

                players[editor.player].languages.push(editor.language);
            }

            const storage = {
                meta: {
                    tie: game.storage?.meta?.teamScores[0]?.tie || false,
                    bets: { tie: game.storage?.meta?.bets?.tie || 0 },
                    teamScores: {
                        0: {
                            id: 0,
                            ui: game.storage?.meta?.teamScores[0]?.ui || 0,
                            ux: game.storage?.meta?.teamScores[0]?.ux || 0,
                            bets: game.storage?.meta?.bets?.blue || 0,
                            objectives: game.storage?.teams[0].objectives,
                        },
                        1: {
                            id: 1,
                            ui: game.storage?.meta?.teamScores[1]?.ui || 0,
                            ux: game.storage?.meta?.teamScores[1]?.ux || 0,
                            bets: game.storage?.meta?.bets?.red || 0,
                            objectives: game.storage?.teams[1].objectives,
                        },
                    },
                },
                templates,
                objectives,
            };

            await queryRunner.query('update game set "storage" = $1 where game.id = $2;', [storage, game.id]);

            for (const playerindex in players) {
                const player = players[playerindex];

                const locatedUserId = await this.createOrLocateUserByDetails(queryRunner, player);
                if (_.isNil(locatedUserId)) throw new Error('erro');
                // check if a game application exists for the user and if it exists then update, otherwise
                // create the new game application for the given user.
                const gameAppRepository = queryRunner.manager.getCustomRepository(GameApplicationRepository);
                let existing = await gameAppRepository.findOne({ where: { gameId: game.id, userId: locatedUserId } });

                if (_.isNil(existing)) {
                    existing = new GameApplication({ id: game.id } as Game, { id: locatedUserId } as User);
                }

                existing.team = player.team;
                existing.assignedLanguages = player.languages.join(',');

                await queryRunner.manager.save(existing);
            }
        }

        // step 6. Alter game start time to not be nullable.
        await queryRunner.query('alter table game alter column "startTime" set not null;');

        // step 7. remove twithc id from user stats
        await queryRunner.dropColumn('user_stats', 'twitchId');
    }

    public async down(): Promise<any> {
        return;
    }
}
