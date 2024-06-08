import { getClient } from './db/config.js';

const sequelize = getClient();

export default sequelize;
