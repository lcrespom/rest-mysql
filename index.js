import * as db from './srv/db';
import * as crudRouter from './srv/crud-router';

module.exports = {
	setupDB: db.setup,
	getCrudHandler: db.getCrudHandler,
	createRouter,
	addTableRoute
};
