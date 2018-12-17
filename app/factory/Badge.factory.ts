import {Badge} from "../models/Badge";

export class BadgeFactory {
    public static create(name: string, description: string, coins: number, xp: number) {
        const badge = new Badge();

        Object.assign(badge, {
            coins,
            description,
            name,
            xp,
        });

        return badge;
    }
}
