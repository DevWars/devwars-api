import * as express from 'express';

const DocsRoute: express.Router = express.Router();

DocsRoute.use(express.static('docs'));

export { DocsRoute };
