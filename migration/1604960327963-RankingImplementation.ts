import {MigrationInterface, QueryRunner} from 'typeorm';

import RankRepository from '../app/repository/rank.repository';
import RankSeeding from '../app/seeding/rank.seeding';

export class RankingImplementation1604960327963 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          create table rank
          (
               id               serial not null constraint "PK_a5dfd2e605e5e4fb8578caec083" primary key,
               "updatedAt"      timestamp default now() not null,
               "createdAt"      timestamp default now() not null,
               level            integer                 not null,
               name             varchar                 not null,
               total_experience integer                 not null
          );`);


    const rankRepository = queryRunner.manager.getCustomRepository(RankRepository);

    for (const rank of RankSeeding.default()) {
      await rankRepository.save(rank);
    }
  }

  public async down(): Promise<void> {
    return;
  }

}
