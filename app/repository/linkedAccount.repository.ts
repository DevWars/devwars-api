import { EntityRepository, Repository } from 'typeorm';
import LinkedAccount, { Provider } from '../models/linkedAccount.model';
import * as _ from 'lodash';

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

    /**
     * Creates the missing provider account.
     * @param username The username of the account being created.
     * @param providerId The provider id of the account.
     * @param provider The provider of the account, e.g twitch.
     */
    public async createOrFindMissingAccount(
        username: string,
        providerId: string,
        provider: Provider,
        relations: string[] = []
    ): Promise<LinkedAccount> {
        const existingAccount = await this.findOne({ where: { providerId, provider }, relations });

        if (!_.isNil(existingAccount)) return existingAccount;

        const newAccount = new LinkedAccount(null, username, provider, providerId);
        return this.save(newAccount);
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
