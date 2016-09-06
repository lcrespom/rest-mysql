var fs = require('fs');
var https = require('https');
var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');

var db = require('../src/db');
var crudRouter = require('../src/crud-router');
var auth = require('../src/auth');


//-------------------- Init configuration data --------------------

var WEB_PORT = process.env.PORT || 443;
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
auth.registerLogin(router, '/login', getUserData);
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
// SSL self-signed keys using this command:
//	> openssl req -new -x509 -nodes -out server.crt -keyout server.key
//  More info here: http://stackoverflow.com/questions/14267010/how-to-create-self-signed-ssl-certificate-for-test-purposes
var privateKey = fs.readFileSync('example/test-keys/server.key');
var certificate = fs.readFileSync('example/test-keys/server.crt');
https.createServer({
	key: privateKey,
	cert: certificate
}, app).listen(WEB_PORT);
console.log('API server ready on port ' + WEB_PORT);


//-------------------- Getting users for login --------------------

function getUserData(userId, cb) {
	var sql = `SELECT * FROM users WHERE userid=?`;
	dbconn.query(sql, [userId], (err, rows) => {
		var user = null;
		if (!err && rows)
			user = rows[0];
		cb(user);
	});
}


//-------------------- App setup --------------------
function createExpressApp() {
	var app = express();
	setupCompression(app);
	setupJSON(app);
	auth.setup(getJwtSecret());
	return app;
}

function setupCompression(app) {
  	// Enable gzip compression
  	app.use(compression());
}

function setupJSON(app) {
  	// Configure app to use bodyParser()
  	// this will let us get the data from a POST
  	app.use(bodyParser.urlencoded({ extended: true }));
  	app.use(bodyParser.json());
	return app;
}

function getJwtSecret() {
	return "Mxmbawlx50XOpKkUMcY2wNjoRmU06g3ComNXJfxfnyt9ESuAKSQxe8FXG" +
		"2dgiEtWdUxbqK9hZ9sWZ4KdGwI5pRmQo0xivuMlh5G2f0ZBco2eDPEZ269Mg" +
		"z4af93xm9Xg";
}