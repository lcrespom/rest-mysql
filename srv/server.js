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
			thandler.find(req.params, (err, rows, fields) => {
				if (err) return handleError(err, res);
				//TODO add "self" property to each item
				res.json({ items: rows });
			});
		})
		.post((req, res) => {
			thandler.create(req.body, (err, result) => {
				if (err) return handleError(err, res);
				//TODO validate req.body to be non-empty
				var id = result.insertId;
				res.json({
					id,
					self: fullLink(req, url, id)
				});
			});
		});
	router.route(url + '/:id')
		.get((req, res) => {
			thandler.byId(req.params.id, (err, rows, fields) => {
				if (err) return handleError(err, res);
				//TODO add "self" property
				var row = rows.length > 0 ? rows[0] : {};
				res.json(row);
			});
		})
		.put((req, res) => {
			thandler.update(req.params.id, req.body, (err, result) => {
				//TODO validate req.body to be non-empty
				if (err) return handleError(err, res);
				if (result.changedRows > 0)
					res.json({ updated: true });
				else
					respondNotFound(req, res, url, req.params.id);
			});
		})
		.delete((req, res) => {
			thandler.delete(req.params.id, (err, result) => {
				if (err) return handleError(err, res);
				if (result.changedRows > 0)
					res.json({ deleted: true });
				else
					respondNotFound(req, res, url, req.params.id);
			});
		});
}

function fullLink(req, url, id) {
	var protocol = req.secure ? "https" : "http";
	return protocol + '://' + req.headers.host + req.baseUrl + url + '/' + id;
}

function handleError(err, res) {
	console.warn('Error from DB:', err);
	//TODO inspect err and pass helpful information to client
	res.status(400)
	.json({
		message: 'Bad Request'
	});
}

function respondNotFound(req, res, url, id) {
	res.status(404)
	.json({
		message: `Item ${fullLink(req, url, id)} not found`
	});
}
