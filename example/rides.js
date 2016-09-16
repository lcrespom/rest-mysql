var db = require('../src/db');
var crudRouter = require('../src/crud-router');

var RECENT_ADDR_LEN = 10;

var routeConfig = {
	"url": "/rides",
	"table": "rides",
	"title": "Taxi rides",
	"roles": { "employee": true }
}

function registerRoute(router, dbconn) {
	var url = routeConfig.url;
	var rideTH = db.getCrudHandler(dbconn, routeConfig.table);
	var addrTH = db.getCrudHandler(dbconn, 'addresses');
	var custTH = db.getCrudHandler(dbconn, 'customers');
	router.route(url).get((req, res) => {
		res.json({ message: 'get pending' });
	});
	router.route(url).post((req, res) => {
		postRide(req, res, rideTH, addrTH, custTH, url);
	});
	router.route(url).put((req, res) => {
		res.json({ message: 'put pending' });
	});
	router.route(url).delete((req, res) => {
		res.json({ message: 'delete pending' });
	});
}

function postRide(req, res, rideTH, addrTH, custTH, url) {
	var ride = req.body;
	checkNewAddress(ride.fromAddress, addrTH, (err1, result1) => {
		checkNewAddress(ride.toAddress, addrTH, (err2, result2) => {
			if (err1 || err2)
				return crudRouter.handleError(err1 ? err1 : err2, res);
			updateRecentAddresses(ride.customerId, result1, result2, custTH);
			var backendRide = mapColumns(ride, rideColumns);
			rideTH.create(backendRide, (err, result) => {
				if (err)
					return crudRouter.handleError(err, res);
				var id = result.insertId;
				res.status(201).json(crudRouter.addSelfLink({ id }, req, url, id));
			});
		});
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

function checkNewAddress(addr, thandler, cb) {
	// Empty address: set address_id to null
	if (!addr.street && !addr.town && !addr.name) {
		addr.id = null;
		return cb();
	}
	// Valid address_id: great, nothing to do
	if (addr.id != -1)
		return cb(null, { insertId: addr.id });
	// If address_id == -1, we need to create the address
	thandler.create(addr, cb);
}

function updateRecentAddresses(customerId, r1, r2, thandler) {
	if (isNaN(customerId)) return;
	if (!r1 && !r2) return;
	var a1 = -1, a2 = -1;
	if (r1) a1 = r1.insertId;
	if (r2) a2 = r2.insertId;
	thandler.byId(customerId, (err, rows) => {
		if (rows.length != 1) return;
		var recent_addrs = rows[0].recent_addrs;
		var recent;
		if (recent_addrs == null || recent_addrs.length == 0)
			recent = [];
		else
			recent = recent_addrs.split(',').map(x => +x);
		if (a1 >= 0) recent = addRecent(recent, a1);
		if (a2 >= 0) recent = addRecent(recent, a2);
		recent.splice(RECENT_ADDR_LEN);
		recent_addrs = recent.join(',');
		thandler.update(customerId, { recent_addrs });
	});
}

function addRecent(arr, e) {
	return [e].concat(arr.filter(x => x != e));
}

//------------------------------ Exports ------------------------------

module.exports = {
	routeConfig,
	registerRoute
};