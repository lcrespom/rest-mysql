var db = require('./db');
var auth = require('./auth');

var HATEOAS_LINKS = true;
var ROUTE_LINKS = [];

function createRouter(express) {
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

function addRoute(router, routeConfig) {
	registerRoute(routeConfig);
	var url = routeConfig.url;
	if (routeConfig.roles)
		auth.registerAuthorizationCheck(router, routeConfig.roles, url);
	return url;
}

function addCrudRoute(router, routeConfig, dbconn) {
	var url = addRoute(router, routeConfig);
	var thandler = db.getCrudHandler(dbconn, routeConfig.table);
	//---------- Routes without id (get list, post new) ----------
	router.route(url).get((req, res) => {
		thandler.find(req.params, (err, rows, fields) => {
			if (err) return handleError(err, res);
			rows.forEach(row => addSelfLink(row, req, url, row.id));
			res.json({ items: rows });
		});
	});
	registerPost(router, url, thandler, routeConfig.fkCreate);
	//---------- Routes with id (get one, put, delete) ----------
	registerGetOne(router, url, thandler, routeConfig.fkGetOne);
	registerPut(router, url, thandler, routeConfig.fkUpdate);
	router.route(url + '/:id').delete((req, res) => {
		thandler.delete(req.params.id, (err, result) => {
			//TODO cascade on delete (FK consnstraint does not seem to work)
			if (err) return handleError(err, res);
			if (result.affectedRows > 0)
				res.json({ deleted: true });
			else
				handleNotFoundError(req, res, url, req.params.id);
		});
	});
}

function registerPost(router, url, thandler, fkeys) {
	router.route(url).post((req, res) => {
		var createCB = (err, result) => {
			if (err) {
				if (Object.keys(req.body).length == 0)
					return handleEmptyBodyError(err, res);
				else
					return handleError(err, res);
			}
			var id = result.insertId;
			res.status(201).json(addSelfLink({ id }, req, url, id));
		};
		if (fkeys)
			thandler.createWithFK(req.body, fkeys, createCB);
		else
			thandler.create(req.body, createCB);
	});
}

function registerGetOne(router, url, thandler, fkeys) {
	router.route(url + '/:id').get((req, res) => {
		var id = req.params.id;
		var byIdCB = (err, rows, fields) => {
			if (err) return handleError(err, res);
			if (rows.length == 0)
				handleNotFoundError(req, res, url, id);
			else
				res.json(addSelfLink(rows[0], req, url, id));
		};
		if (fkeys)
			thandler.byIdWithFK(id, fkeys, byIdCB);
		else
			thandler.byId(id, byIdCB);
	});
}

function registerPut(router, url, thandler, fkeys) {
	router.route(url + '/:id').put((req, res) => {
		removeSelfLink(req.body);
		var id = req.params.id;
		var updateCB = (err, result) => {
			if (err) {
				if (Object.keys(req.body).length == 0)
					return handleEmptyBodyError(err, res);
				else
					return handleError(err, res);
			}
			if (result.affectedRows > 0)
				res.json(addSelfLink({ updated: true }, req, url, id));
			else
				handleNotFoundError(req, res, url, id);
		};
		if (fkeys)
			thandler.updateWithFK(id, req.body, fkeys, updateCB);
		else
			thandler.update(id, req.body, updateCB);
	});
}


//------------------------------ HATEOAS utils ------------------------------

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


//------------------------------ Exports ------------------------------

module.exports = {
	createRouter,
	addRoute,
	addCrudRoute
};
