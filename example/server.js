var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var cors = require('cors');

var db = require('../src/db');
var crudRouter = require('../src/crud-router');
var auth = require('../src/auth');

var rides = require('./rides');
var config = require('./config').init(process.argv[2]);


//-------------------- Server setup --------------------

// Create DB connection
var dbconn = db.setup(config.mySql);
// Router setup
var router = crudRouter.createRouter(express);
for (var routeConfig of config.tableRoutes)
	crudRouter.addCrudRoute(router, routeConfig, dbconn);
crudRouter.addRoute(router, rides.routeConfig);
rides.registerRoute(router, dbconn);
auth.registerLogin(router, '/login', getUserData);
// App startup
var app = createExpressApp(config);
if (config.cors)
	app.use('/api', cors());
// Register REST API
app.use('/api', router);
// Register static routes
var serveIndex = (req, res) => res.sendFile(config.webPath + '/index.html');
config.clientRoutes.forEach(route => {
	app.use('/' + route, serveIndex);
	app.use('/' + route + '/*', serveIndex);
});
app.use(express.static(config.webPath));
// And finally, start server
// SSL self-signed keys using this command:
//	> openssl req -new -x509 -nodes -out server.crt -keyout server.key
//  More info here: http://stackoverflow.com/questions/14267010/how-to-create-self-signed-ssl-certificate-for-test-purposes
if (config.https) {
	options = {
		key: fs.readFileSync('example/test-keys/server.key'),
		cert: fs.readFileSync('example/test-keys/server.crt')
	}
	https.createServer(options, app).listen(config.webPort);
}
else {
	http.createServer(app).listen(config.webPort);
}
console.log('API server ready on port ' + config.webPort);


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
function createExpressApp(config) {
	var app = express();
	setupCompression(app);
	setupJSON(app);
	auth.setup(config.jwtSecret, config.bcrypt);
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
