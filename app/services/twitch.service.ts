import axios from 'axios';
import { stringify } from 'qs';

import logger from '../utils/logger';

export interface ITwitchUser {
    id: string;
    username: string;
}

export class TwitchService {
    public static async accessTokenForCode(code: string): Promise<string> {
        let tokenEndpoint = 'https://id.twitch.tv/oauth2/token?';

        const params: {
            [index: string]: string;
        } = {
            client_id: process.env.TWITCH_CLIENT,
            client_secret: process.env.TWITCH_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${process.env.API_URL}/oauth/twitch`,
        };

        for (const paramKey of Object.keys(params)) {
            tokenEndpoint += `${paramKey}=${params[paramKey]}&`;
        }

        try {
            const response = await axios({
                method: 'post',
                url: tokenEndpoint.substring(0, tokenEndpoint.length - 1),
            });

            return response.data.access_token;
        } catch (error) {
            logger.error(`error performing twitch lookup, ${error}`);
            return null;
        }
    }

    public static async twitchUserForToken(token: string): Promise<ITwitchUser> {
        const userEndpoint = 'https://api.twitch.tv/helix/users';

        try {
            const response = await axios.get(userEndpoint, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const { id, login: username } = response.data.data[0];

            return { id: id as string, username: username as string };
        } catch (e) {
            return null;
        }
    }
}
