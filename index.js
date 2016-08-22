var db = require('./srv/db');
var crudRouter = require('./srv/crud-router');

module.exports = {
	setupDB: db.setup,
	getCrudHandler: db.getCrudHandler,
	createRouter,
	addTableRoute
};
