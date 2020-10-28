import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLevel1603625472057 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS leaderboard');
        await queryRunner.dropColumn('user_stats', 'level');
    }

    public async down(): Promise<any> {
        return null;
    }
}
