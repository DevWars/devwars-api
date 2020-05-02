import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import * as _ from 'lodash';

export class UserLastUsernameUpdatedAt1587826717118 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        const userTable = await queryRunner.getTable('user');

        // if the table does not exist or the column already exists, then just exist the migration.
        // otherwise continue to adding the new column.
        if (
            _.isNil(userTable) ||
            !_.isNil(_.find(userTable.columns, (column) => column.name === 'lastUsernameUpdateAt'))
        )
            return;

        await queryRunner.addColumn(
            'user',
            new TableColumn({
                name: 'lastUsernameUpdateAt',
                default: null,
                type: 'timestamp',
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const userTable = await queryRunner.getTable('user');

        // if the table does not exist or the column does not exists, then just exist the migration.
        // otherwise continue to removing the column.
        if (
            _.isNil(userTable) ||
            _.isNil(_.find(userTable.columns, (column) => column.name === 'lastUsernameUpdateAt'))
        )
            return;

        await queryRunner.dropColumn('user', 'lastUsernameUpdateAt');
    }
}
