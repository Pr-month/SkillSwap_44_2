import { appConfig } from './app.config';
import { dbConfig } from './db.config';
import { jwtConfig } from './jwt.config';

export const configLoaders = [appConfig, jwtConfig, dbConfig];
