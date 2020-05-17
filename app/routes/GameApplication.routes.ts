import * as express from 'express';

const GameApplicationRoute: express.Router = express.Router();

// TODO: move to /users/:user/applications
GameApplicationRoute.get('/mine');

// TODO: move to games/:game/applications
GameApplicationRoute.post('/schedule/:schedule/twitch');

export { GameApplicationRoute };
