import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class GameSourceCreation1601675832351 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE public.game_source (
                id integer NOT NULL,
                "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                file character varying NOT NULL,
                source character varying NOT NULL,
                team integer NOT NULL,
                "gameId" integer
            );`);

        await queryRunner.query(`
        ALTER TABLE ONLY public.game_source 
        ADD CONSTRAINT "FK_5b1c4b25920e9fda96c1a310a1d" 
        FOREIGN KEY ("gameId") REFERENCES public.game(id);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey(
            'game_source',
            new TableForeignKey({
                columnNames: ['id'],
                referencedTableName: 'game',
                referencedColumnNames: ['id'],
            })
        );

        await queryRunner.dropTable('game_source');
    }
}
