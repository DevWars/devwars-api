import axios from 'axios';
import * as mailgun from 'mailgun.js';

export class MailService {
    public static async send(to: string[], email: string, params: object) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        try {
            const response = await axios.get('http://web:3000/mail/translate/' + email, { params });

            const { html, subject } = response.data;

            const client = mailgun.client({ username: 'api', key: process.env.MAILGUN_KEY });

            client.messages.create('devwars.tv', {
                from: 'DevWars <noreply@devwars.tv>',
                html,
                message: 'text/html',
                subject,
                to,
            });
        } catch (e) {
            console.error(e);
        }
    }
}
