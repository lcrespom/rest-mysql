var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var db = require('./db');
var crudRouter = require('./crud-router');

// Init configuration data
var WEB_PORT = process.env.PORT || 1337;
var tableRoutes = [{
	url: '/test',
	table: 'test2',
	title: 'Testing table'
}, {
	url: '/addresses',
	table: 'addresses',
	title: 'Postal address'
}, {
	url: '/customers',
	table: 'customers',
	title: 'Customer table',
	fkGetOne: { id_pickup_addr: 'addresses' }
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
	// Configure app to use bodyParser()
	// this will let us get the data from a POST
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	// Enable gzip compression
	app.use(compression());
	return app;
}

