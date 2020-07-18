import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
import * as _ from 'lodash';

export class ScheduleRemoval1595070268811 implements MigrationInterface {
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

                if (_.isNil(players[editor.player]))
                    players[editor.player] = { team: editor.team, id: editor.player, languages: [] };

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
                            objectives: game.storage?.teams[0].objectives
                        },
                        1: {
                            id: 1,
                            ui: game.storage?.meta?.teamScores[1]?.ui || 0,
                            ux: game.storage?.meta?.teamScores[1]?.ux || 0,
                            bets: game.storage?.meta?.bets?.red || 0,
                            objectives: game.storage?.teams[1].objectives
                        }
                    },
                },
                templates,
                objectives
            }

            await queryRunner.query('update game set "storage" = $1 where game.id = $2;', [storage, game.id]);

            for (const playerindex in players) {
                const player = players[playerindex];

                await queryRunner.query(`
                update game_application set "team" = $1, "assignedLanguages" = $2 
                where "gameId" = $3 and "userId" = $4;`, [player.team, player.languages.join(','), game.id, player.id]);
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
