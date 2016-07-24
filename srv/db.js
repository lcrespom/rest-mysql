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
			conn.query(sql, (err, rows, fields) => {
				//TODO errors should be passed to callback
				if (err) throw err;
				cb(rows);
			});
		},
		byId: (id, cb) => {
			var sql = `SELECT * FROM ${tableName} WHERE id=?`;
			conn.query(sql, [id], (err, rows, fields) => {
				//TODO errors should be passed to callback
				if (err) throw err;
				var row = rows.length > 0 ? rows[0] : {};
				cb(row);
			});
		},
		create: (params, cb) => {
			var sql = `INSERT INTO ${tableName} SET ?`;
			conn.query(sql, params, (err, result) => {
				//TODO errors should be passed to callback
				if (err) throw err;
				cb({ id: result.insertId });
			});
		},
		update: (id, params, cb) => {
			var sql = `UPDATE ${tableName} SET ? WHERE id=?`;
			conn.query(sql, [params, id], (err, result) => {
				//TODO errors should be passed to callback
				if (err) throw err;
				cb({ updated: true });
			});
		},
		delete: (id, cb) => {
			var sql = `DELETE FROM ${tableName} WHERE id=?`;
			conn.query(sql, [id], (err, result) => {
				//TODO errors should be passed to callback
				if (err) throw err;
				cb({ deleted: true });
			});
		}
	}
}

module.exports = {
	setup, getCrudHandler
};