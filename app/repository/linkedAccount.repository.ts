import { EntityRepository, Repository, In } from 'typeorm';
import LinkedAccount, { Provider } from '../models/linkedAccount.model';

@EntityRepository(LinkedAccount)
export default class LinkedAccountRepository extends Repository<LinkedAccount> {
    public findAllByUserId(userId: number, relations?: string[]): Promise<LinkedAccount[]> {
        return this.find({ where: { user: userId }, relations });
    }

    public findByUserIdAndProvider(userId: number, provider: string, relations?: string[]): Promise<LinkedAccount> {
        return this.findOne({ where: { user: userId, provider: provider.toUpperCase() }, relations });
    }

    public findByProviderAndProviderId(provider: string, providerId: string): Promise<LinkedAccount> {
        return this.findOne({ where: { provider, providerId }, relations: ['user'] });
    }

    public async createMissingAccounts(
        providerIds: { id: any; username: string }[],
        provider: Provider
    ): Promise<LinkedAccount[]> {
        const existingAccounts = await this.find({ providerId: In(providerIds) });

        const newUsers = providerIds.filter(
            (providerAccount) => !existingAccounts.find((account) => account.providerId === providerAccount.id)
        );

        const newAccounts = newUsers.map((user) => new LinkedAccount(null, user.username, provider, user.id));
        return this.save(newAccounts);
    }

    public async findWithPaging({
        first,
        after,
        orderBy = 'createdAt',
        relations = [],
    }: {
        first: number;
        after: number;
        orderBy: string;
        relations?: string[];
    }): Promise<LinkedAccount[]> {
        return this.find({
            skip: after,
            take: first,
            order: {
                [orderBy]: 'DESC',
            },
            relations,
        });
    }
}
