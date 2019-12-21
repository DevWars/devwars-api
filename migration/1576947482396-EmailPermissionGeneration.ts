import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import EmailOptIn from '../app/models/EmailOptIn';

export class EmailPermissionGeneration1576947482396 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(
            new Table({
                name: 'email_opt_in',
                columns: [
                    {
                        name: 'id',
                        type: 'number',
                        isPrimary: true,
                    },
                    {
                        name: 'updatedAt',
                        type: 'date',
                    },
                    {
                        name: 'createdAt',
                        type: 'date',
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
    }

    public async down(queryRunner: QueryRunner): Promise<any> {}
}
