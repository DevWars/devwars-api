import { EntityRepository, Repository } from 'typeorm';
import PasswordReset from '../models/passwordReset.model';

@EntityRepository(PasswordReset)
export default class PasswordResetRepository extends Repository<PasswordReset> {
    public findByToken(token: string): Promise<PasswordReset> {
        return this.findOne({ where: { token }, relations: ['user'] });
    }
}
