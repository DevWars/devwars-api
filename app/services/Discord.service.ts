import axios from 'axios';
import { stringify } from 'qs';

export interface IDiscordUser {
    id: string;
    username: string;
}

export class DiscordService {
    public static async accessTokenForCode(code: string): Promise<string> {
        const tokenEndpoint = 'https://discordapp.com/api/oauth2/token';

        const params = {
            client_id: process.env.DISCORD_CLIENT,
            client_secret: process.env.DISCORD_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${process.env.ROOT_URL}/oauth/discord`,
            scope: 'identify',
        }

        try {
            const response = await axios({
                method: 'post',
                url: tokenEndpoint,
                data: stringify(params),
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            })

            return response.data.access_token;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    public static async discordUserForToken(token: string): Promise<IDiscordUser> {
        const userEndpoint = 'https://discordapp.com/api/users/@me';

        try {
            const response = await axios.get(userEndpoint, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const {id, username} = response.data;

            return {id: id as string, username: username as string};
        } catch (e) {
            return null;
        }
    }
}
