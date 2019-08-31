import { EntityRepository, Repository } from 'typeorm';
import LinkedAccount from '../models/LinkedAccount';
import User from '../models/User';

@EntityRepository(User)
export default class LinkedAccountRepository extends Repository<LinkedAccount> {
    public findAllByUserId(userId: number): Promise<LinkedAccount[]> {
        return LinkedAccount.find({ where: { user: userId }, relations: ['user'] });
    }

    public findByUserIdAndProvider(userId: number, provider: string): Promise<LinkedAccount> {
        return LinkedAccount.findOne({ where: { user: userId, provider }, relations: ['user'] });
    }

    public findByProviderAndProviderId(provider: string, providerId: string): Promise<LinkedAccount> {
        return LinkedAccount.findOne({ where: { provider, providerId }, relations: ['user'] });
    }
}
