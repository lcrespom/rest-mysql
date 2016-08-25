var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var db = require('./db');
var crudRouter = require('./crud-router');

//-------------------- Init configuration data --------------------
var WEB_PORT = process.env.PORT || 1337;
// REST routes
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
	fkGetOne: { id_pickup_addr: 'addresses' },
	fkUpdate: { id_pickup_addr: 'addresses' },
	fkCreate: { id_pickup_addr: 'addresses' }
}];
// Location of static resources
var webPath = process.argv[2] || 'web';
// Angular 2 app routes, redirected to index.html
var ngRoutes = [];
if (process.argv[3]) ngRoutes = process.argv[3].split(':');
// Database configuration
var mysqlConfig = require('./mysql-config.json');
mysqlConfig.port = process.env.MYSQL_PORT || mysqlConfig.port;

//-------------------- Server setup --------------------
// Create DB connection
var dbconn = db.setup(mysqlConfig);
// Router setup
var router = crudRouter.createRouter(express);
for (var routeConfig of tableRoutes)
	crudRouter.addTableRoute(router, routeConfig, dbconn);
// App startup
var app = createApp();
app.use('/api', router);			// Register REST API
var static = express.static(webPath);
ngRoutes.forEach(route => app.use('/' + route + '/*', static));
app.use(static);		// Register static web server
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

