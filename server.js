var express = require('express');
var bodyParser = require('body-parser');
var db = require('./db');
var mysqlConfig = require('./mysql-config.json');

var dbconn = db.setup(mysqlConfig);
var app = createApp();
var port = process.env.PORT || 1337;
var router = createRouter();
addTableRoute(router, '/test', 'test2');
app.use('/api', router);	// all of our routes will be prefixed with /api
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
	router.route(url)
	.get((req, res) => {
		thandler.find(req.params, items => res.json({ items }));
	})
	.post((req, res) => {
		thandler.create(req.body, result => {
			result.self = fullLink(url + '/' + result.id);
			res.json(result);
		});
	});
}

function fullLink(link) {
	//TODO compose full link
	return 'http://host:port/api' + link;
}
