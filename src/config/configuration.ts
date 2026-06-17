import { appConfig } from './app.config';
import { dbConfig } from './db.config';
import { jwtConfig } from './jwt.config';
// Здесь позже будут добавлены другие конфиги (database, jwt и т.д.)

export const configLoaders = [appConfig, jwtConfig, dbConfig];
