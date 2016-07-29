var express = require('express');
var bodyParser = require('body-parser');
var db = require('./db');
var crudRouter = require('./crud-router');

// Init configuration data
var WEB_PORT = process.env.PORT || 1337;
var tableRoutes = [{
	url: '/test',
	table: 'test2',
	title: 'Testing table'
}];
var webPath = process.argv[2] || 'web';
var mysqlConfig = require('./mysql-config.json');
mysqlConfig.port = process.env.MYSQL_PORT || mysqlConfig.port;
// Create DB connection
var dbconn = db.setup(mysqlConfig);
// Router setup
var router = crudRouter.createRouter(express);
for (var routeConfig of tableRoutes)
	crudRouter.addTableRoute(router, routeConfig, dbconn);
// App startup
var app = createApp();
app.use('/api', router);			// Register REST API
app.use(express.static(webPath));		// Register static web server
app.listen(WEB_PORT);
console.log('API server ready on port ' + WEB_PORT);


//-------------------- App setup  --------------------
function createApp() {
	var app = express();
	// configure app to use bodyParser()
	// this will let us get the data from a POST
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	return app;
}

