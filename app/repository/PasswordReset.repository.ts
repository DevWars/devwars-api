import { EntityRepository, Repository } from 'typeorm';
import PasswordReset from '../models/PasswordReset';

@EntityRepository(PasswordReset)
export default class PasswordResetRepository extends Repository<PasswordReset> {
    public findByToken(token: string): Promise<PasswordReset> {
        return PasswordReset.findOne({ where: { token }, relations: ['user'] });
    }
}
