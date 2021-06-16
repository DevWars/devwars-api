import * as faker from 'faker';
import EmailOptIn from '../models/emailOptIn.model';
import User from '../models/user.model';

export default class EmailOptInSeeding {
    public static default(user?: User): EmailOptIn {
        return new EmailOptIn(
            user,
            faker.datatype.boolean(),
            faker.datatype.boolean(),
            faker.datatype.boolean(),
            faker.datatype.boolean(),
        );
    }
}
