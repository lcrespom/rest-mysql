var routeConfig = {
	"url": "/rides",
	"table": "rides",
	"title": "Taxi rides",
	"roles": { "employee": true }
}

function registerRoute(router, dbconn) {
	var url = routeConfig.url;
	router.route(url).get((req, res) => {
		res.json({ message: 'get pending' });
	});
	router.route(url).post((req, res) => {
		res.json({ message: 'post pending' });
	});
	router.route(url).put((req, res) => {
		res.json({ message: 'put pending' });
	});
	router.route(url).delete((req, res) => {
		res.json({ message: 'delete pending' });
	});
}


//------------------------------ Exports ------------------------------

module.exports = {
	routeConfig,
	registerRoute
};