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
		find: (params, cb) => {
			var sql = `SELECT * FROM ${tableName}`;
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
				//TODO restructure nested tables so main table is root
				if (rows[0])
					rows[0] = mergeRow(rows[0], tableName, fkeys);
				cb(err, rows, fields);
			});
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

function mergeRow(obj, tableName, fkeys) {
	var result = obj[tableName];
	for (var fk of Object.keys(fkeys))
		result[fk + '_obj'] = obj[fkeys[fk]];
	return result;
}


module.exports = {
	setup,
	getCrudHandler
};
