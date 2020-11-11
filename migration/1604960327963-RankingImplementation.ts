import {MigrationInterface, QueryRunner} from 'typeorm';

import RankRepository from '../app/repository/rank.repository';
import RankSeeding from '../app/seeding/rank.seeding';

export class RankingImplementation1604960327963 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            create table if not exists rank
            (
                id                        serial                  not null,
                "updatedAt"               timestamp default now() not null,
                "createdAt"               timestamp default now() not null,
                name                      varchar                 not null,
                level                     varchar                 not null,
                total_experience          integer                 not null
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
