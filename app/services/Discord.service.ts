import axios from "axios";

export interface IDiscordUser {
    id: string;
    username: string;
}

export class DiscordService {
    public static async accessTokenForCode(code: string): Promise<string> {
        const tokenEndpoint = "https://discordapp.com/api/oauth2/token";

        try {
            const response = await axios.post(tokenEndpoint, null, {
                auth: {username: process.env.DISCORD_CLIENT, password: process.env.DISCORD_SECRET},
                params: {
                    code: {code},
                    grant_type: "authorization_code",
                    redirect_uri: `${process.env.ROOT_URL}/oauth/discord`,
                    scope: "identify",
                },
            });

            return response.data.access_token;
        } catch (e) {
            console.error(e.response);
            return null;
        }
    }

    public static async discordUserForToken(token: string): Promise<IDiscordUser> {
        const userEndpoint = "https://discordapp.com/api/users/@me";

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
