import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import EmailOptIn from '../app/models/EmailOptIn';
import User from '../app/models/User';

export class EmailPermissionGeneration1576947482396 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(
            new Table({
                name: 'email_opt_in',
                columns: [
                    {
                        name: 'id',
                        type: 'integer',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'email_opt_in_news',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'email_opt_in_applications',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'email_opt_in_schedules',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'email_opt_in_linked_accounts',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'userId',
                        type: 'integer',
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'email_opt_in',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'user',
                onDelete: 'CASCADE',
            })
        );

        const users = await queryRunner.manager.find<User>(User);

        for (const user of users) {
            await queryRunner.manager.save(new EmailOptIn(user));
        }
    }

    /**
     * Drops the related email opt in table and ensures that all related foreign keys
     * (relationships) are removed during the process.
     */
    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable('email_opt_in', true, true, true);
    }
}
