import { EntityRepository, Repository } from 'typeorm';
import LinkedAccount from '../models/LinkedAccount';
import User from '../models/User';

@EntityRepository(User)
export default class LinkedAccountRepository extends Repository<LinkedAccount> {
    public findAllByUserId(userId: number): Promise<LinkedAccount[]> {
        return LinkedAccount.find({ where: { userId } });
    }

    public findAllByProviderId(providerId: string): Promise<LinkedAccount[]> {
        return LinkedAccount.find({ where: { providerId } });
    }
}
