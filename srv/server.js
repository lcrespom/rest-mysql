var express = require('express');
var bodyParser = require('body-parser');

var db = require('./db');
var mysqlConfig = require('./mysql-config.json');


mysqlConfig.port = process.env.MYSQL_PORT || mysqlConfig.port;
var dbconn = db.setup(mysqlConfig);
var app = createApp();
var router = createRouter();
addTableRoute(router, '/test', 'test2');
app.use('/api', router);	// all of our routes will be prefixed with /api
app.use(express.static('web'));
var port = process.env.PORT || 1337;
app.listen(port);			// Start server
console.log('API server ready on port ' + port);


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

function addTableRoute(router, url, table) {
	//TODO proper, generic error handling
	thandler = db.getCrudHandler(dbconn, table);
	router.route(url)
		.get((req, res) => {
			//TODO add "self" property to each item
			thandler.find(req.params, items => res.json({ items }));
		})
		.post((req, res) => {
			//TODO validate req.body to be non-empty
			thandler.create(req.body, result => {
				result.self = fullLink(req, url, result.id);
				res.json(result);
			});
		});
	router.route(url + '/:id')
		.get((req, res) => {
			//TODO add "self" property
			thandler.byId(req.params.id, item => res.json(item));
		})
		.put((req, res) => {
			//TODO validate req.body to be non-empty
			thandler.update(req.params.id, req.body, result => res.json(result));
		})
		.delete((req, res) => {
			thandler.delete(req.params.id, result => res.json(result));
		});
}

function fullLink(req, url, id) {
	var protocol = req.secure ? "https" : "http";
	return protocol + '://' + req.headers.host + req.baseUrl + url + '/' + id;
}
