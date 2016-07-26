var express = require('express');
var bodyParser = require('body-parser');
var db = require('./db');

// Init configuration data
var HATEOAS_LINKS = true;
var ROUTE_LINKS = [];
var WEB_PORT = process.env.PORT || 1337;
var tableRoutes = [{
	url: '/test',
	table: 'test2',
	title: 'Testing table'
}];
var mysqlConfig = require('./mysql-config.json');
mysqlConfig.port = process.env.MYSQL_PORT || mysqlConfig.port;
// Create DB connection
var dbconn = db.setup(mysqlConfig);
// Router setup
var router = createRouter();
for (var route of tableRoutes)
	addTableRoute(router, route);
// App startup
var app = createApp();
app.use('/api', router);			// Register REST API
app.use(express.static('web'));		// Register static web server
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

//-------------------- Router --------------------

function createRouter() {
	var router = express.Router();
	router.use((req, res, next) => {
		//TODO perform common tasks here, e.g. tracing, authentication, etc.
		next();
	});
	router.get('/', (req, res) => {
		// Return API catalog in HATEOAS style
		res.json({ 'link-templates': ROUTE_LINKS });
	});
	return router;
}

function registerRoute(routeConfig) {
	ROUTE_LINKS.push({
		rel: routeConfig.url.substr(1),
		href: '/api' + routeConfig.url,
		title: routeConfig.title
	});
}

function addTableRoute(router, routeConfig) {
	registerRoute(routeConfig);
	var url = routeConfig.url;
	var table = routeConfig.table;
	thandler = db.getCrudHandler(dbconn, table);
	//---------- Routes without id (get list, post new) ----------
	router.route(url)
		.get((req, res) => {
			thandler.find(req.params, (err, rows, fields) => {
				if (err) return handleError(err, res);
				rows.forEach(row => addSelfLink(row, req, url, row.id));
				res.json({ items: rows });
			});
		})
		.post((req, res) => {
			removeSelfLink(req.body);
			thandler.create(req.body, (err, result) => {
				if (err) {
					if (Object.keys(req.body).length == 0)
						return handleEmptyBodyError(err, res);
					else
						return handleError(err, res);
				}
				var id = result.insertId;
				res.json(addSelfLink({ id }, req, url, id));
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
					res.json(addSelfLink(row, req, url, id));
				}
			});
		})
		.put((req, res) => {
			removeSelfLink(req.body);
			var id = req.params.id;
			thandler.update(id, req.body, (err, result) => {
				if (err) {
					if (Object.keys(req.body).length == 0)
						return handleEmptyBodyError(err, res);
					else
						return handleError(err, res);
				}
				if (result.changedRows > 0)
					res.json(addSelfLink({ updated: true }, req, url, id));
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

function addSelfLink(obj, req, url, id) {
	if (!HATEOAS_LINKS) return obj;
	obj.self = fullLink(req, url, id);
	return obj;
}

function removeSelfLink(obj) {
	if (!HATEOAS_LINKS) return obj;
	delete obj.self;
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
