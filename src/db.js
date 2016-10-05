var mysql = require('mysql');

function setup(config) {
	console.log("DB: creating connection...")
	var dbconn = mysql.createConnection(config);
	dbconn.connect(function(err) {
		if (err) {
			console.error('Error connecting to DB:');
			console.error(err);
			throw new Error('Error connecting to DB');
		}
		else {
			console.log('connected to MYSQL');
		}
	});
	return dbconn;
}

function getCrudHandler(conn, tableName) {
	return {
		find: (routeConfig, cb) => {
			var sql = `SELECT * FROM ${tableName}`;
			if (routeConfig.orderBy)
				sql += ' ORDER BY ' + routeConfig.orderBy;
			conn.query(sql, cb);
		},
		byId: (id, cb) => {
			var sql = `SELECT * FROM ${tableName} WHERE id=?`;
			conn.query(sql, [id], cb);
		},
		create: (params, cb) => {
			var sql = `INSERT INTO ${tableName} SET ?`;
			conn.query(sql, params, cb);
		},
		update: (id, params, cb) => {
			var sql = `UPDATE ${tableName} SET ? WHERE id=?`;
			conn.query(sql, [params, id], cb);
		},
		delete: (id, cb) => {
			var sql = `DELETE FROM ${tableName} WHERE id=?`;
			conn.query(sql, [id], cb);
		},

		byIdWithFK: (id, fkeys, cb) => {
			var sql = sqlLeftJoin(tableName, fkeys) + ` WHERE ${tableName}.id = ?`;
			var options = { sql, nestTables: true };
			conn.query(options, [id], (err, rows, fields) => {
				if (rows && rows[0])
					rows[0] = mergeObj(rows[0], tableName, fkeys);
				cb(err, rows, fields);
			});
		},
		createWithFK: (params, fkeys, cb) => {
			var objs = splitObj(params, tableName, fkeys);
			var owner = objs[tableName];
			var errs = [];
			var results = [];
			var fkNames = Object.keys(fkeys);
			var keys = Object.keys(objs);
			keys.shift();
			for (var key of keys) {
				var sql = `INSERT INTO ${key} SET ?`;
				conn.query(sql, objs[key], (err, result) => {
					errs.push(err);
					if (!err)
						owner[fkNames[results.length]] = result.insertId;
					results.push(result);
					if (results.length == keys.length) {
						sql = `INSERT INTO ${tableName} SET ?`;
						conn.query(sql, owner, cb);
					}
				});
			}
		},
		updateWithFK: (id, params, fkeys, cb) => {
			var objs = splitObj(params, tableName, fkeys);
			var errs = [];
			var results = [];
			var keys = Object.keys(objs);
			for (var key of keys) {
				var sql = `UPDATE ${key} SET ? WHERE id=?`;
				var id = objs[key].id;
				conn.query(sql, [objs[key], id], (err, result) => {
					errs.push(err);
					results.push(result);
					if (results.length == keys.length)
						cb(errs.find(e => e != null), results[0]);
				});
			}
		}
	}
}

function sqlLeftJoin(tableName, fkeys) {
	var select = tableName + '.*';
	var ljoin = '';
	for (var fk of Object.keys(fkeys)) {
		var ftable = fkeys[fk];
		select += ', ' + ftable + '.*';
		ljoin += ` LEFT JOIN ${ftable} ON ${tableName}.${fk} = ${ftable}.id`;
	}
	return `SELECT ${select} FROM ${tableName} ${ljoin}`;
}

function mergeObj(obj, tableName, fkeys) {
	var result = obj[tableName];
	for (var fk of Object.keys(fkeys))
		result['$' + fk] = obj[fkeys[fk]];
	return result;
}

function splitObj(obj, tableName, fkeys) {
	var result = {};
	result[tableName] = obj;
	for (var k of Object.keys(obj)) {
		if (k[0] == '$') {
			var tname = fkeys[k.substr(1)];
			delete obj[k].self; // Remove HATEOAS self
			result[tname] = obj[k];
			delete obj[k];
		}
	}
	return result;
}

module.exports = {
	setup,
	getCrudHandler
};
