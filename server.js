var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var mysqlConfig = require('./mysql-config.json');

var dbconn = createDBConnection();
var app = createApp();
var port = process.env.PORT || 1337;
var router = createRouter();
addTableRoute(router, 'test', 'test2');
app.use('/api', router);	// all of our routes will be prefixed with /api
app.listen(port);			// Start server
console.log('API server ready on port ' + port);


//-------------------- DB -------------------- 
function createDBConnection() {
	console.log("DB: creating connection...")
	var dbconn = mysql.createConnection(mysqlConfig);
	dbconn.connect(function(err) {
		if (err) {
			console.error('Error connecting to DB:');
			console.error(err);
			throw new Error('Error connecting to DB');
		}
		else {
			console.log('connected to MYSQL');
		}
	});
	return dbconn;
}

//-------------------- App setup  --------------------
function createApp() {
	var app = express();
	// configure app to use bodyParser()
	// this will let us get the data from a POST
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	return app;
}



//-------------------- Router -------------------- 

function createRouter() {
	var router = express.Router();
	router.use((req, res, next) => {
		//TODO perform common tasks here, e.g. tracing, authentication, etc. 
		next();
	});
	router.get('/', (req, res) => {
		//TODO provide some HATEOAS-style links
		res.json({ message: 'Welcome to the REST API' });   
	});
	return router;
}

function addTableRoute(router, route, table) {
	router.route('/test')
	.get((req, res) => {
		res.json({ message: 'TODO: reply table content' });   
	});
}