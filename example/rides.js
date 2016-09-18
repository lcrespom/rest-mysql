var db = require('../src/db');
var crudRouter = require('../src/crud-router');

var RECENT_ADDR_LEN = 10;

var routeConfig = {
	"url": "/rides",
	"table": "rides",
	"title": "Taxi rides",
	"roles": { "employee": true }
}


//------------------------------ Request handling ------------------------------

function registerRoute(router, dbconn) {
	var url = routeConfig.url;
	var rideTH = db.getCrudHandler(dbconn, routeConfig.table);
	var addrTH = db.getCrudHandler(dbconn, 'addresses');
	var custTH = db.getCrudHandler(dbconn, 'customers');
	router.route(url + '/:fromDate/:toDate').get((req, res) => {
		getRides(req, res, dbconn);
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
	router.route('/customers/recent_addrs/:id').get((req, res) => {
		getRecentAddrs(req.params.id, res, dbconn);
	});
}

function getRides(req, res, dbconn) {
	var fromDate = jsonDate2sqlDateTime(req.params.fromDate);
	var toDate = jsonDate2sqlDateTime(req.params.toDate);
	var select = 'SELECT rides.*, customers.name, customers.surname';
	var from = ' FROM rides';
	var join = ' LEFT JOIN customers on rides.customer_id = customers.id';
	var where = ' WHERE pickup_dt >= ? and pickup_dt <= ?';
	var orderBy = ' ORDER BY pickup_dt';
	var sql = select + from + join + where + orderBy;
	//var sql = 'SELECT * FROM rides WHERE pickup_dt >= ? and pickup_dt <= ? ORDER BY pickup_dt';
	//TODO provide customer name/surname
	//	using join, e.g. SELECT rides.*, customers.name, customers.surname FROM rides left join customers on rides.customer_id = customers.id
	dbconn.query({ sql, nestTables: true }, [fromDate, toDate], (err, rows) => {
		if (err)
			return crudRouter.handleError(err, res);
		res.json({
			items: rows.map(row => {
				result = mapColumns(row.rides, rideColumnsOut);
				result.customer = row.customers;
				return result;
			})
		});
	});
}

function postRide(req, res, rideTH, addrTH, custTH, url) {
	var ride = req.body;
	checkNewAddress(ride.fromAddress, addrTH, (err1, result1) => {
		checkNewAddress(ride.toAddress, addrTH, (err2, result2) => {
			if (err1 || err2)
				return crudRouter.handleError(err1 ? err1 : err2, res);
			updateRecentAddresses(ride, custTH);
			var backendRide = mapColumns(ride, rideColumnsIn);
			rideTH.create(backendRide, (err, result) => {
				if (err)
					return crudRouter.handleError(err, res);
				var id = result.insertId;
				res.status(201).json(crudRouter.addSelfLink({ id }, req, url, id));
			});
		});
	});
}

function getRecentAddrs(customerId, res, dbconn) {
	// Get recent addresses for customer id
	var sql = 'SELECT id_pickup_addr, recent_addrs FROM customers WHERE id=?';
	dbconn.query(sql, [customerId], (err, rows) => {
		if (err)
			return crudRouter.handleError(err, res);
		var recent = rows[0].recent_addrs;
		var custAddrId = rows[0].id_pickup_addr;
		// Prepend default customer's pickup address
		if (validNumberList(recent)) {
			if (custAddrId != null)
				recent = custAddrId + ',' + recent;
		}
		else {
			if (custAddrId == null)
				return res.json({ items: [] });
			recent = '' + custAddrId;
		}
		// Get the address records with the specified id's
		var sql = `SELECT * FROM addresses WHERE id in (${recent})`;
		dbconn.query(sql, (err, rows) => {
			if (err)
				return crudRouter.handleError(err, res);
			// Sort list of addresses according to order specified in recent_addrs
			var items = [];
			for (var addrId of recent.split(',')) {
				var addr = rows.find(a => a.id == addrId);
				if (items.indexOf(addr) == -1)
					items.push(addr);
			}
			res.json({ items });
		});
	});
}


//------------------------------ Data access ------------------------------

function validNumberList(list) {
	if (!list) return false;
	return /^[\d,]+$/.test(list);
}

function jsonDate2sqlDateTime(dt) {
	return dt.substr(0, 10) + ' ' + dt.substr(11, 8);
}

var rideColumnsIn = {
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

var rideColumnsOut = {
	id: 'id',
	pickup_dt: 'pickupDT',
	customer_id: 'customerId',
	state: 'state',
	from_addr_id: 'fromAddress',
	to_addr_id: 'toAddress',
	amount: 'amount',
	payment_type: 'payType',
	comments: 'comments'
}

function mapColumns(src, map) {
	var dst = {};
	for (var fromProp of Object.keys(src)) {
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
		return cb();
	// If address_id == -1, we need to create the address
	delete addr.id;
	thandler.create(addr, (err, result) => {
		if (err)
			return cb(err, result);
		addr.id = result.insertId;
		cb();
	});
}

function updateRecentAddresses(ride, thandler) {
	if (!ride || isNaN(ride.customerId)) return;
	var id1 = ride.fromAddress.id;
	var id2 = ride.toAddress.id;
	if (isNaN(id1) && isNaN(id2)) return;
	thandler.byId(ride.customerId, (err, rows) => {
		if (rows.length != 1) return;
		var recent_addrs = rows[0].recent_addrs;
		var recent;
		if (recent_addrs == null || recent_addrs.length == 0)
			recent = [];
		else
			recent = recent_addrs.split(',').map(x => +x);
		if (id1 != null) recent = addRecent(recent, id1);
		if (id2 != null) recent = addRecent(recent, id2);
		recent.splice(RECENT_ADDR_LEN);
		recent_addrs = recent.join(',');
		thandler.update(ride.customerId, { recent_addrs });
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