import {date, name, random} from 'faker';

import {AddressFactory} from '../factory';
import {Competitor, User} from '../models';

export class CompetitorFactory {
    public static default(): Competitor {
        const competitor = new Competitor();

        Object.assign(competitor, {
            address: AddressFactory.default(),
            createdAt: date.past(),
            dob: date.past(50),
            name: {
                firstName: name.firstName(),
                lastName: name.lastName(),
            },
            ratings: {
                css: random.number({min: 1, max: 5}),
                html: random.number({min: 1, max: 5}),
                js: random.number({min: 1, max: 5}),
            },
            updatedAt: date.past(),
        });

        return competitor;
    }

    public static withUser(user: User): Competitor {
        const competitor = this.default();

        competitor.user = user;

        return competitor;
    }
}
