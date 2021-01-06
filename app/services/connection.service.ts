import { config } from '../config';
import { createConnection } from 'typeorm';

export const Connection = createConnection(config.databaseOptions);
