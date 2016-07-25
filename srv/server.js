var express = require('express');
var bodyParser = require('body-parser');

var db = require('./db');
var mysqlConfig = require('./mysql-config.json');


mysqlConfig.port = process.env.MYSQL_PORT || mysqlConfig.port;
var dbconn = db.setup(mysqlConfig);
var app = createApp();
var router = createRouter();
addTableRoute(router, '/test', 'test2');
app.use('/api', router);	// all REST API routes will be prefixed with /api
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
	thandler = db.getCrudHandler(dbconn, table);
	//---------- Routes without id (get list, post new) ----------
	router.route(url)
		.get((req, res) => {
			thandler.find(req.params, (err, rows, fields) => {
				if (err) return handleError(err, res);
				rows.forEach(row => row.self = fullLink(req, url, row.id));
				res.json({ items: rows });
			});
		})
		.post((req, res) => {
			delete req.body.self; // Just in case, remove "self" from req.body
			thandler.create(req.body, (err, result) => {
				if (err) {
					if (Object.keys(req.body).length == 0)
						return handleEmptyBodyError(err, res);
					else
						return handleError(err, res);
				}
				var id = result.insertId;
				res.json({
					id,
					self: fullLink(req, url, id)
				});
			});
		});
	//---------- Routes with id (get one, put, delete) ----------
	router.route(url + '/:id')
		.get((req, res) => {
			var id = req.params.id;
			thandler.byId(id, (err, rows, fields) => {
				if (err) return handleError(err, res);
				if (rows.length == 0) {
					handleNotFoundError(req, res, url, id);
				}
				else {
					var row = rows[0];
					row.self = fullLink(req, url, id);
					res.json(row);
				}
			});
		})
		.put((req, res) => {
			delete req.body.self; // Just in case, remove "self" from req.body
			var id = req.params.id;
			thandler.update(id, req.body, (err, result) => {
				if (err) {
					if (Object.keys(req.body).length == 0)
						return handleEmptyBodyError(err, res);
					else
						return handleError(err, res);
				}
				if (result.changedRows > 0)
					res.json({
						updated: true,
						self: fullLink(req, url, id)
					});
				else
					handleNotFoundError(req, res, url, id);
			});
		})
		.delete((req, res) => {
			thandler.delete(req.params.id, (err, result) => {
				if (err) return handleError(err, res);
				if (result.changedRows > 0)
					res.json({ deleted: true });
				else
					handleNotFoundError(req, res, url, req.params.id);
			});
		});
}

function fullLink(req, url, id) {
	var protocol = req.secure ? "https" : "http";
	return protocol + '://' + req.headers.host + req.baseUrl + url + '/' + id;
}


//------------------------------ Error handling ------------------------------

function handleError(err, res) {
	if (err.code == 'ER_PARSE_ERROR') {
		console.error('SQL Parse error from DB:', err);
		res.status(500)
		.json({
			message: 'Server error'
		});
	}
	else {
		console.warn('Error from DB:', err);
		res.status(400)
		.json({
			message: 'Bad Request'
		});
	}
}

function handleEmptyBodyError(err, res) {
	console.warn('Error from DB:', err);
	res.status(400)
	.json({
		message: 'Bad Request: body should not be empty'
	});
}

function handleNotFoundError(req, res, url, id) {
	res.status(404)
	.json({
		message: `Item ${fullLink(req, url, id)} not found`
	});
}
