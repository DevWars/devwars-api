import { EntityRepository, Repository } from 'typeorm';
import { LinkedAccount, User } from '../models';

@EntityRepository(User)
export class LinkedAccountRepository extends Repository<LinkedAccount> {
    public findAllByUserId(userId: number): Promise<LinkedAccount[]> {
        return LinkedAccount.find({ where: { userId } });
    }

    public findAllByProviderId(providerId: string): Promise<LinkedAccount[]> {
        return LinkedAccount.find({ where: { providerId } });
    }
}
