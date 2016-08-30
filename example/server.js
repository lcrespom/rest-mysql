var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var db = require('../src/db');
var crudRouter = require('../src/crud-router');

//-------------------- Init configuration data --------------------
var WEB_PORT = process.env.PORT || 1337;
// REST routes
var tableRoutes = require('./table-routes.json');
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
var app = createExpressApp();
// Register REST API
app.use('/api', router);
// Register static routes
var serveIndex = (req, res) => res.sendFile(webPath + '/index.html');
ngRoutes.forEach(route => {
	app.use('/' + route, serveIndex);
	app.use('/' + route + '/*', serveIndex);
});
app.use(express.static(webPath));
// And finally, start server
app.listen(WEB_PORT);
console.log('API server ready on port ' + WEB_PORT);


//-------------------- App setup  --------------------
function createExpressApp() {
	var app = express();
	// Enable gzip compression
	app.use(compression());
	// Configure app to use bodyParser()
	// this will let us get the data from a POST
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	return app;
}

