var db = require('../src/db');
var crudRouter = require('../src/crud-router');


var routeConfig = {
	"url": "/rides",
	"table": "rides",
	"title": "Taxi rides",
	"roles": { "employee": true }
}

function registerRoute(router, dbconn) {
	var url = routeConfig.url;
	var thandler = db.getCrudHandler(dbconn, routeConfig.table);
	router.route(url).get((req, res) => {
		res.json({ message: 'get pending' });
	});
	router.route(url).post((req, res) => {
		postRide(req, res, thandler, url);
	});
	router.route(url).put((req, res) => {
		res.json({ message: 'put pending' });
	});
	router.route(url).delete((req, res) => {
		res.json({ message: 'delete pending' });
	});
}

function jsonDate2sqlDateTime(dt) {
	return dt.substr(0, 10) + ' ' + dt.substr(11, 8);
}

var rideColumns = {
	id: 'id',
	pickupDT: 'pickup_dt',
	$pickupDT: dt => jsonDate2sqlDateTime(dt),
	customerId: 'customer_id',
	state: 'state',
	fromAddress: 'from_addr_id',
	$fromAddress: a => a.id,
	toAddress: 'to_addr_id',
	$toAddress: a => a.id,
	amount: 'amount',
	payType: 'payment_type',
	comments: 'comments'
}

function mapColumns(src, map) {
	var dst = {};
	for (fromProp of Object.keys(src)) {
		var toProp = map[fromProp];
		if (!toProp) continue;
		var fun = map['$' + fromProp];
		if (!fun)
			dst[toProp] = src[fromProp];
		else
			dst[toProp] = fun(src[fromProp]);
	}
	return dst;
}

function postRide(req, res, thandler, url) {
	var ride = req.body;
	checkNewAddress(ride.fromAddress, thandler, err1 => {
		checkNewAddress(ride.toAddress, thandler, err2 => {
			if (err1 || err2)
				return crudRouter.handleError(err1 ? err1 : err2, res);
			var backendRide = mapColumns(ride, rideColumns);
			thandler.create(backendRide, (err, result) => {
				if (err)
					return crudRouter.handleError(err, res);
				var id = result.insertId;
				res.status(201).json(crudRouter.addSelfLink({ id }, req, url, id));
			});
		});
	});
}

function checkNewAddress(addr, thandler, cb) {
	// Empty address: set address_id to null
	if (!addr.street && !addr.town && !addr.name) {
		addr.id = null;
		return cb();
	}
	// Valid address_id: great, nothing to do
	if (addr.id != -1) return cb();
	// If address_id == -1, we need to create the address
	thandler.create(addr, cb);
}

//------------------------------ Exports ------------------------------

module.exports = {
	routeConfig,
	registerRoute
};